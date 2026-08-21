process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret";

const assert = require("node:assert/strict");
const test = require("node:test");
const mongoose = require("mongoose");
const Order = require("../src/models/order.model");
const PaymentTransaction = require("../src/models/paymentTransaction.model");
const FinancialAuditLog = require("../src/models/financialAuditLog.model");
const OutboxEvent = require("../src/models/outboxEvent.model");
const User = require("../src/models/user.model");
const { applyCashfreePaymentState, canTransition, paymentState, resolveSuccessfulPayment } = require("../src/services/payment-state.service");

test("payment state machine preserves paid as a terminal payment state", () => {
  assert.equal(paymentState("SUCCESS"), "paid");
  assert.equal(paymentState("UNEXPECTED"), "review_required");
  assert.equal(canTransition("pending", "paid"), true);
  assert.equal(canTransition("paid", "failed"), false);
});

test("failed, pending, and dropped webhooks cannot regress a paid attempt", async () => {
  for (const cashfreeStatus of ["FAILED", "PENDING", "USER_DROPPED"]) {
    const attempt = { status: "paid", save: async () => { throw new Error("paid attempt must not be saved"); } };
    const result = await applyCashfreePaymentState({ attempt, cashfreeStatus, paymentId: "payment-1" });
    assert.equal(result.changed, false);
    assert.equal(attempt.status, "paid");
  }
});

test("Cashfree payment transitions record their source and correlation", async () => {
  const originalCreate = FinancialAuditLog.create;
  const auditLogs = [];
  FinancialAuditLog.create = async (values) => { auditLogs.push(values); return values; };
  const attempt = { _id: "64eaf61043b6f85db67b6613", order: "64eaf61043b6f85db67b6612", status: "pending", cashfreeStatus: "PENDING", save: async () => {} };
  try {
    await applyCashfreePaymentState({ attempt, cashfreeStatus: "FAILED", paymentId: "cf-payment-1", actorType: "cashfree_webhook", correlationId: "webhook-1" });
    assert.deepEqual(auditLogs[0], { actor: null, actorType: "cashfree_webhook", order: "64eaf61043b6f85db67b6612", paymentTransaction: "64eaf61043b6f85db67b6613", refund: null, action: "payment_status_updated", previousState: { status: "pending", cashfreeStatus: "PENDING" }, newState: { status: "failed", cashfreeStatus: "FAILED" }, correlationId: "webhook-1", paymentId: "cf-payment-1", details: {} });
  } finally {
    FinancialAuditLog.create = originalCreate;
  }
});

test("failed, dropped, and pending attempts can later be paid", () => {
  for (const state of ["failed", "user_dropped", "pending"]) assert.equal(canTransition(state, "paid"), true);
});

test("payment success after expiry or cancellation is put into review instead of being confirmed", async () => {
  const originalExists = PaymentTransaction.exists;
  const originalPaymentUpdate = PaymentTransaction.findOneAndUpdate;
  const originalUpdate = Order.findOneAndUpdate;
  const originalStartSession = mongoose.startSession;
  const attempt = { _id: "attempt-1", status: "created", save: async () => {} };
  const order = { _id: "order-1", status: "cancelled", expiresAt: new Date(Date.now() - 1) };
  PaymentTransaction.exists = async () => null;
  PaymentTransaction.findOneAndUpdate = async () => ({ ...attempt, status: "review_required" });
  Order.findOneAndUpdate = async () => ({ ...order, status: "payment_received_after_cancellation" });
  mongoose.startSession = async () => ({ withTransaction: async (work) => work({}), endSession: async () => {} });
  try {
    const lateResult = await resolveSuccessfulPayment({ order, attempt, paymentId: "payment-1" });
    assert.equal(lateResult.outcome, "review_required");
    assert.equal(attempt.status, "review_required");

    const duplicateAttempt = { _id: "attempt-2", status: "created", save: async () => {} };
    PaymentTransaction.exists = async () => ({ _id: "other-paid-attempt" });
    const duplicateResult = await resolveSuccessfulPayment({ order: { ...order, status: "pending_payment", expiresAt: new Date(Date.now() + 60_000) }, attempt: duplicateAttempt, paymentId: "payment-2" });
    assert.equal(duplicateResult.reason, "duplicate_payment");
    assert.equal(duplicateAttempt.status, "review_required");
  } finally {
    PaymentTransaction.exists = originalExists;
    PaymentTransaction.findOneAndUpdate = originalPaymentUpdate;
    Order.findOneAndUpdate = originalUpdate;
    mongoose.startSession = originalStartSession;
  }
});

test("a repeated success webhook returns the already confirmed order", async () => {
  const originals = {
    startSession: mongoose.startSession,
    exists: PaymentTransaction.exists,
    updatePayment: PaymentTransaction.findOneAndUpdate,
    findOrder: Order.findById,
  };
  const attempt = { _id: "attempt-1", status: "paid", cfPaymentId: "payment-1" };
  const order = { _id: "order-1", status: "pending_payment", expiresAt: new Date(Date.now() + 60_000) };
  mongoose.startSession = async () => ({ withTransaction: async (work) => work({}), endSession: async () => {} });
  PaymentTransaction.exists = async () => null;
  PaymentTransaction.findOneAndUpdate = async () => null;
  Order.findById = async () => ({ _id: "order-1", status: "confirmed", paymentTransaction: "attempt-1" });
  try {
    const result = await resolveSuccessfulPayment({ order, attempt, paymentId: "payment-1" });
    assert.equal(result.outcome, "confirmed");
    assert.equal(result.order.status, "confirmed");
  } finally {
    mongoose.startSession = originals.startSession;
    PaymentTransaction.exists = originals.exists;
    PaymentTransaction.findOneAndUpdate = originals.updatePayment;
    Order.findById = originals.findOrder;
  }
});

test("a pending payment later succeeds by webhook without a customer return and records the outbox in one session", async () => {
  const originals = {
    startSession: mongoose.startSession,
    exists: PaymentTransaction.exists,
    findOneAndUpdate: PaymentTransaction.findOneAndUpdate,
    updateOrder: Order.findOneAndUpdate,
    findOrder: Order.findById,
    updateOutbox: OutboxEvent.updateOne,
    findUser: User.findById,
  };
  const session = { withTransaction: async (work) => work(session), endSession: async () => {} };
  const attempt = { _id: "attempt-1", status: "pending", cfPaymentId: "payment-1", amountPaise: 10_000 };
  const order = { _id: "order-1", user: "user-1", status: "pending_payment", paymentMethod: "upi", expiresAt: new Date(Date.now() + 60_000), items: [] };
  const paymentCalls = [];
  const orderCalls = [];
  const outboxCalls = [];

  mongoose.startSession = async () => session;
  PaymentTransaction.exists = async () => null;
  PaymentTransaction.findOneAndUpdate = async (...args) => {
    paymentCalls.push(args);
    return { ...attempt, status: "paid" };
  };
  Order.findOneAndUpdate = async (...args) => {
    orderCalls.push(args);
    return { ...order, status: "confirmed", paymentStatus: "paid", paymentTransaction: attempt._id, activePaymentTransaction: null };
  };
  Order.findById = () => ({ populate: async () => ({ ...order, status: "confirmed", paymentStatus: "paid", paymentTransaction: attempt._id, user: { _id: "user-1" } }) });
  OutboxEvent.updateOne = async (...args) => { outboxCalls.push(args); };
  User.findById = async () => ({ cartItems: [], save: async () => {} });
  try {
    const result = await resolveSuccessfulPayment({ order, attempt, paymentId: "payment-1" });
    assert.equal(result.outcome, "confirmed");
    assert.equal(paymentCalls[0][2].session, session);
    assert.equal(orderCalls[0][2].session, session);
    assert.ok(orderCalls[0][0].expiresAt.$gt instanceof Date);
    assert.equal(outboxCalls.length, 2);
    assert.ok(outboxCalls.every(([, , options]) => options.session === session));
  } finally {
    mongoose.startSession = originals.startSession;
    PaymentTransaction.exists = originals.exists;
    PaymentTransaction.findOneAndUpdate = originals.findOneAndUpdate;
    Order.findOneAndUpdate = originals.updateOrder;
    Order.findById = originals.findOrder;
    OutboxEvent.updateOne = originals.updateOutbox;
    User.findById = originals.findUser;
  }
});

test("two simultaneous success resolutions confirm one order and return the same result", async () => {
  const originals = {
    startSession: mongoose.startSession,
    exists: PaymentTransaction.exists,
    updatePayment: PaymentTransaction.findOneAndUpdate,
    updateOrder: Order.findOneAndUpdate,
    findOrder: Order.findById,
    updateOutbox: OutboxEvent.updateOne,
    findUser: User.findById,
  };
  const attempt = { _id: "attempt-1", status: "pending", cfPaymentId: "payment-1", amountPaise: 10_000 };
  const order = { _id: "order-1", user: "user-1", status: "pending_payment", paymentMethod: "upi", expiresAt: new Date(Date.now() + 60_000), items: [] };
  const confirmed = { ...order, status: "confirmed", paymentStatus: "paid", paymentTransaction: attempt._id, activePaymentTransaction: null, user: { _id: "user-1" } };
  let orderUpdates = 0;
  let outboxWrites = 0;
  mongoose.startSession = async () => ({ withTransaction: async (work) => work({}), endSession: async () => {} });
  PaymentTransaction.exists = async () => null;
  PaymentTransaction.findOneAndUpdate = async () => ({ ...attempt, status: "paid" });
  Order.findOneAndUpdate = async () => ++orderUpdates === 1 ? confirmed : null;
  Order.findById = () => ({ populate: async () => confirmed, then: (resolve) => resolve(confirmed) });
  OutboxEvent.updateOne = async () => { outboxWrites += 1; };
  User.findById = async () => ({ cartItems: [], save: async () => {} });
  try {
    const results = await Promise.all([
      resolveSuccessfulPayment({ order, attempt, paymentId: "payment-1" }),
      resolveSuccessfulPayment({ order, attempt, paymentId: "payment-1" }),
    ]);
    assert.deepEqual(results.map((result) => result.outcome), ["confirmed", "confirmed"]);
    assert.equal(orderUpdates, 2);
    assert.equal(outboxWrites, 2);
  } finally {
    mongoose.startSession = originals.startSession;
    PaymentTransaction.exists = originals.exists;
    PaymentTransaction.findOneAndUpdate = originals.updatePayment;
    Order.findOneAndUpdate = originals.updateOrder;
    Order.findById = originals.findOrder;
    OutboxEvent.updateOne = originals.updateOutbox;
    User.findById = originals.findUser;
  }
});
