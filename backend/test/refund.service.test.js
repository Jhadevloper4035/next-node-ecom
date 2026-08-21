process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret";

const assert = require("node:assert/strict");
const test = require("node:test");
const Order = require("../src/models/order.model");
const PaymentTransaction = require("../src/models/paymentTransaction.model");
const Refund = require("../src/models/refund.model");
const OutboxEvent = require("../src/models/outboxEvent.model");
const { applyCashfreeRefund, initiateRefund, recordDuplicatePaymentAutoRefund, refundStatus } = require("../src/services/refund.service");

test("refund states preserve pending refunds and send unknown gateway states to review", () => {
  assert.equal(refundStatus("PENDING"), "pending");
  assert.equal(refundStatus("SUCCESS"), "success");
  assert.equal(refundStatus("FAILED"), "failed");
  assert.equal(refundStatus("UNEXPECTED"), "review_required");
  assert.ok(Refund.schema.indexes().some(([keys, options]) => keys.order === 1 && keys.idempotencyKey === 1 && options.unique));
});

async function successfulRefund(amountPaise) {
  const originals = {
    reserve: Order.findOneAndUpdate,
    updateOrder: Order.updateOne,
    findPayment: PaymentTransaction.findById,
    updateRefund: Refund.updateOne,
    claimRefund: Refund.findOneAndUpdate,
    findRefund: Refund.findById,
    outbox: OutboxEvent.updateOne,
  };
  const refund = { _id: "refund-1", order: "order-1", paymentTransaction: "payment-1", amountPaise, status: "pending" };
  const payment = { amountPaise: 10_000, status: "paid", save: async () => {} };
  const orderUpdates = [];
  Order.findOneAndUpdate = async () => ({ _id: "order-1", refundedPaise: amountPaise });
  Order.updateOne = async (...args) => { orderUpdates.push(args); };
  PaymentTransaction.findById = async () => payment;
  Refund.findOneAndUpdate = async () => refund;
  Refund.updateOne = async () => {};
  Refund.findById = async () => refund;
  OutboxEvent.updateOne = async () => {};
  try {
    await applyCashfreeRefund(refund, { refund_status: "SUCCESS", cf_refund_id: "cashfree-refund" });
    return { payment, orderUpdate: orderUpdates.at(-1)[1].$set };
  } finally {
    Order.findOneAndUpdate = originals.reserve;
    Order.updateOne = originals.updateOrder;
    PaymentTransaction.findById = originals.findPayment;
    Refund.updateOne = originals.updateRefund;
    Refund.findOneAndUpdate = originals.claimRefund;
    Refund.findById = originals.findRefund;
    OutboxEvent.updateOne = originals.outbox;
  }
}

test("successful full and partial refunds update both order and payment states", async () => {
  const full = await successfulRefund(10_000);
  assert.equal(full.orderUpdate.status, "refunded");
  assert.equal(full.payment.status, "refunded");

  const partial = await successfulRefund(2_500);
  assert.equal(partial.orderUpdate.status, "partially_refunded");
  assert.equal(partial.payment.status, "partially_refunded");
});

test("duplicate refund requests return the existing idempotent refund", async () => {
  const originalFindOrder = Order.findOne;
  const originalFindRefund = Refund.findOne;
  const existingRefund = { _id: "refund-1", refundId: "RF1" };
  Order.findOne = () => ({ populate: async () => ({ _id: "order-1", orderNumber: "CC1" }) });
  Refund.findOne = async () => existingRefund;
  try {
    assert.equal(await initiateRefund({ orderNumber: "CC1", amountPaise: 100, reason: "Duplicate charge", idempotencyKey: "idem-1" }), existingRefund);
  } finally {
    Order.findOne = originalFindOrder;
    Refund.findOne = originalFindRefund;
  }
});

test("a duplicate successful refund webhook does not apply the refund twice", async () => {
  const originalClaimRefund = Refund.findOneAndUpdate;
  const originalFindRefund = Refund.findById;
  const originalReserveOrder = Order.findOneAndUpdate;
  const originalOutbox = OutboxEvent.updateOne;
  const refund = { _id: "refund-1", order: "order-1", paymentTransaction: "payment-1", amountPaise: 100, status: "success" };
  let reservationAttempted = false;
  Refund.findOneAndUpdate = async () => null;
  Refund.findById = async () => refund;
  Order.findOneAndUpdate = async () => { reservationAttempted = true; };
  OutboxEvent.updateOne = async () => {};
  try {
    await applyCashfreeRefund(refund, { refund_status: "SUCCESS", cf_refund_id: "cashfree-refund" });
    assert.equal(reservationAttempted, false);
  } finally {
    Refund.findOneAndUpdate = originalClaimRefund;
    Refund.findById = originalFindRefund;
    Order.findOneAndUpdate = originalReserveOrder;
    OutboxEvent.updateOne = originalOutbox;
  }
});

test("Cashfree auto-refunds the reviewed duplicate payment once", async () => {
  const originals = {
    findOrder: Order.findOne,
    findPayment: PaymentTransaction.findOne,
    updatePayment: PaymentTransaction.findOneAndUpdate,
    findRefund: Refund.findOne,
    createRefund: Refund.create,
    updateRefund: Refund.findOneAndUpdate,
    findRefundById: Refund.findById,
    updateRefundById: Refund.updateOne,
    outbox: OutboxEvent.updateOne,
  };
  const order = { _id: "order-1", status: "payment_review_required", paymentStatus: "paid", paymentTransaction: "payment-1", pricing: { currency: "INR" } };
  const duplicatePayment = { _id: "payment-2", cfPaymentId: "payment-2", amountPaise: 10_000, status: "review_required" };
  let createdRefund;
  let createCount = 0;
  let paymentUpdateCount = 0;
  const outboxEvents = [];
  Order.findOne = async () => order;
  PaymentTransaction.findOne = async () => duplicatePayment;
  PaymentTransaction.findOneAndUpdate = async (...args) => {
    paymentUpdateCount += 1;
    return duplicatePayment;
  };
  Refund.findOne = async () => createdRefund || null;
  Refund.create = async (values) => {
    createdRefund = { ...values, _id: "refund-1" };
    createCount += 1;
    return createdRefund;
  };
  Refund.findOneAndUpdate = async (_filter, update) => {
    if (createdRefund.status === "success") return null;
    createdRefund = { ...createdRefund, ...update.$set };
    return createdRefund;
  };
  Refund.findById = async () => createdRefund;
  Refund.updateOne = async () => {};
  OutboxEvent.updateOne = async (...args) => { outboxEvents.push(args); };
  try {
    const response = {
      refund_type: "PAYMENT_AUTO_REFUND", refund_status: "SUCCESS", refund_amount: 100, refund_currency: "INR", cf_payment_id: "payment-2", cf_refund_id: "auto-refund-1",
    };
    const refund = await recordDuplicatePaymentAutoRefund({
      orderNumber: "CC1",
      refund: response,
    });
    const replay = await recordDuplicatePaymentAutoRefund({ orderNumber: "CC1", refund: response });
    assert.equal(createdRefund.kind, "duplicate_payment_auto");
    assert.equal(createdRefund.paymentTransaction, "payment-2");
    assert.equal(refund.status, "success");
    assert.equal(replay.status, "success");
    assert.equal(createCount, 1);
    assert.equal(paymentUpdateCount, 1);
    assert.deepEqual([...new Set(outboxEvents.map(([, update]) => update.$setOnInsert.dedupeKey))], ["REFUND_COMPLETED:refund-1", "DUPLICATE_PAYMENT_RESOLVED:refund-1"]);
  } finally {
    Order.findOne = originals.findOrder;
    PaymentTransaction.findOne = originals.findPayment;
    PaymentTransaction.findOneAndUpdate = originals.updatePayment;
    Refund.findOne = originals.findRefund;
    Refund.create = originals.createRefund;
    Refund.findOneAndUpdate = originals.updateRefund;
    Refund.findById = originals.findRefundById;
    Refund.updateOne = originals.updateRefundById;
    OutboxEvent.updateOne = originals.outbox;
  }
});

test("concurrent duplicate auto-refund webhooks persist one refund", async () => {
  const originals = {
    findOrder: Order.findOne,
    findPayment: PaymentTransaction.findOne,
    updatePayment: PaymentTransaction.findOneAndUpdate,
    findRefund: Refund.findOne,
    createRefund: Refund.create,
    updateRefund: Refund.findOneAndUpdate,
    findRefundById: Refund.findById,
    updateRefundById: Refund.updateOne,
    updateOrder: Order.findOneAndUpdate,
    outbox: OutboxEvent.updateOne,
  };
  const order = { _id: "order-1", status: "payment_review_required", paymentStatus: "paid", paymentTransaction: "payment-1", pricing: { currency: "INR" } };
  const payment = { _id: "payment-2", cfPaymentId: "payment-2", amountPaise: 10_000, status: "review_required" };
  let refund;
  let createAttempts = 0;
  let paymentUpdates = 0;
  let initialFinds = 0;
  let releaseInitialFinds;
  const bothInitialFinds = new Promise((resolve) => { releaseInitialFinds = resolve; });
  Order.findOne = async () => order;
  PaymentTransaction.findOne = async () => payment;
  PaymentTransaction.findOneAndUpdate = async () => { paymentUpdates += 1; return payment; };
  Refund.findOne = async () => {
    if (refund) return refund;
    initialFinds += 1;
    if (initialFinds === 2) releaseInitialFinds();
    await bothInitialFinds;
    return null;
  };
  Refund.create = async (values) => {
    createAttempts += 1;
    if (refund) {
      const error = new Error("duplicate refund");
      error.code = 11000;
      throw error;
    }
    refund = { ...values, _id: "refund-1" };
    return refund;
  };
  Refund.findOneAndUpdate = async (_filter, update) => {
    if (refund.status === "success") return null;
    refund = { ...refund, ...update.$set };
    return refund;
  };
  Refund.findById = async () => refund;
  Refund.updateOne = async () => {};
  Order.findOneAndUpdate = async () => ({ ...order, refundedPaise: 10_000 });
  OutboxEvent.updateOne = async () => {};
  const response = {
    refund_type: "PAYMENT_AUTO_REFUND", refund_status: "SUCCESS", refund_amount: 100, refund_currency: "INR", cf_payment_id: "payment-2", cf_refund_id: "auto-refund-1",
  };
  try {
    const results = await Promise.all([
      recordDuplicatePaymentAutoRefund({ orderNumber: "CC1", refund: response }),
      recordDuplicatePaymentAutoRefund({ orderNumber: "CC1", refund: response }),
    ]);
    assert.equal(createAttempts, 2);
    assert.equal(refund.status, "success");
    assert.equal(paymentUpdates, 1);
    assert.ok(results.every((result) => result._id === "refund-1"));
  } finally {
    Order.findOne = originals.findOrder;
    PaymentTransaction.findOne = originals.findPayment;
    PaymentTransaction.findOneAndUpdate = originals.updatePayment;
    Refund.findOne = originals.findRefund;
    Refund.create = originals.createRefund;
    Refund.findOneAndUpdate = originals.updateRefund;
    Refund.findById = originals.findRefundById;
    Refund.updateOne = originals.updateRefundById;
    Order.findOneAndUpdate = originals.updateOrder;
    OutboxEvent.updateOne = originals.outbox;
  }
});

test("a refund timeout is retained for reconciliation instead of being discarded", async () => {
  const originals = {
    fetch: globalThis.fetch,
    findOrder: Order.findOne,
    reserve: Order.findOneAndUpdate,
    findRefund: Refund.findOne,
    createRefund: Refund.create,
    updateRefund: Refund.updateOne,
    findRefundById: Refund.findById,
    outbox: OutboxEvent.updateOne,
  };
  const refund = { _id: "refund-1", refundId: "RF1", order: "order-1", paymentTransaction: "payment-1", status: "created", save: async () => { refund.status = "pending"; } };
  const order = { _id: "order-1", orderNumber: "CC1", status: "confirmed", paymentStatus: "paid", paymentTransaction: { _id: "payment-1", cfPaymentId: "payment-1", amountPaise: 10_000, status: "paid" } };
  let timeoutUpdate;
  globalThis.fetch = async () => { throw new Error("timeout"); };
  Order.findOne = () => ({ populate: async () => order });
  Order.findOneAndUpdate = async () => order;
  Refund.findOne = async () => null;
  Refund.create = async () => refund;
  Refund.updateOne = async (...args) => { timeoutUpdate = args; };
  Refund.findById = async () => refund;
  OutboxEvent.updateOne = async () => {};
  try {
    await initiateRefund({ orderNumber: "CC1", amountPaise: 100, reason: "Duplicate charge", idempotencyKey: "idem-1" });
    assert.equal(timeoutUpdate[1].$set.status, "review_required");
  } finally {
    globalThis.fetch = originals.fetch;
    Order.findOne = originals.findOrder;
    Order.findOneAndUpdate = originals.reserve;
    Refund.findOne = originals.findRefund;
    Refund.create = originals.createRefund;
    Refund.updateOne = originals.updateRefund;
    Refund.findById = originals.findRefundById;
    OutboxEvent.updateOne = originals.outbox;
  }
});
