process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret";
process.env.CASHFREE_CLIENT_SECRET = "webhook-test-secret";

const crypto = require("crypto");
const assert = require("node:assert/strict");
const test = require("node:test");
const Order = require("../src/models/order.model");
const PaymentTransaction = require("../src/models/paymentTransaction.model");
const PaymentWebhookEvent = require("../src/models/paymentWebhookEvent.model");
const OutboxEvent = require("../src/models/outboxEvent.model");
const Refund = require("../src/models/refund.model");
const { cashfreeWebhook } = require("../src/controllers/payment.controller");

const originalWebhookEventCreate = PaymentWebhookEvent.create;
const originalWebhookEventFind = PaymentWebhookEvent.findOne;
const originalWebhookEventClaim = PaymentWebhookEvent.findOneAndUpdate;
const originalWebhookEventUpdate = PaymentWebhookEvent.updateOne;

test.beforeEach(() => {
  PaymentWebhookEvent.create = async (values) => ({ ...values, save: async () => {} });
  PaymentWebhookEvent.findOne = async () => null;
  PaymentWebhookEvent.findOneAndUpdate = async () => null;
  PaymentWebhookEvent.updateOne = async () => {};
});

test.afterEach(() => {
  PaymentWebhookEvent.create = originalWebhookEventCreate;
  PaymentWebhookEvent.findOne = originalWebhookEventFind;
  PaymentWebhookEvent.findOneAndUpdate = originalWebhookEventClaim;
  PaymentWebhookEvent.updateOne = originalWebhookEventUpdate;
});

test("USER_DROPPED keeps the order pending and records the payment attempt", async () => {
  const originalFindOrder = Order.findOne;
  const originalFindTransaction = PaymentTransaction.findById;
  const originalFindPayment = PaymentTransaction.findOne;
  const originalPaymentExists = PaymentTransaction.exists;
  const originalOutboxUpdate = OutboxEvent.updateOne;
  const order = { _id: "order-id", orderNumber: "CC123", status: "pending_payment", activePaymentTransaction: "payment-id", pricing: { currency: "INR" } };
  const transaction = { status: "pending", amountPaise: 10_000, currency: "INR", cfOrderId: "cf-order", save: async () => {} };
  const rawBody = JSON.stringify({
    type: "PAYMENT_USER_DROPPED_WEBHOOK",
    data: { order: { order_id: "CC123", cf_order_id: "cf-order" }, payment: { cf_payment_id: "payment-123", payment_status: "USER_DROPPED", payment_amount: 100, payment_currency: "INR" } },
  });
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = crypto.createHmac("sha256", process.env.CASHFREE_CLIENT_SECRET).update(`${timestamp}${rawBody}`).digest("base64");
  let statusCode;

  Order.findOne = async () => order;
  PaymentTransaction.findById = async () => transaction;
  PaymentTransaction.findOne = async () => null;
  PaymentTransaction.exists = async () => null;
  OutboxEvent.updateOne = async () => {};
  try {
    await cashfreeWebhook(
      { body: Buffer.from(rawBody), get: (header) => header === "x-webhook-signature" ? signature : timestamp },
      { status: (code) => { statusCode = code; return { json: () => {} }; }, json: () => {} },
    );
    assert.equal(statusCode, 200);
    assert.equal(order.status, "pending_payment");
    assert.equal(transaction.status, "user_dropped");
    assert.equal(transaction.cfPaymentId, "payment-123");
  } finally {
    Order.findOne = originalFindOrder;
    PaymentTransaction.findById = originalFindTransaction;
    PaymentTransaction.findOne = originalFindPayment;
    PaymentTransaction.exists = originalPaymentExists;
    OutboxEvent.updateOne = originalOutboxUpdate;
  }
});

test("a new Cashfree payment ID is stored as a separate attempt", async () => {
  const originalFindOrder = Order.findOne;
  const originalUpdateOrder = Order.updateOne;
  const originalFindTransaction = PaymentTransaction.findById;
  const originalFindPayment = PaymentTransaction.findOne;
  const originalCount = PaymentTransaction.countDocuments;
  const originalCreate = PaymentTransaction.create;
  const order = { _id: "order-id", orderNumber: "CC123", status: "pending_payment", activePaymentTransaction: "attempt-1", pricing: { currency: "INR" } };
  const previousAttempt = { _id: "attempt-1", status: "user_dropped", cfPaymentId: "payment-1", gateway: "cashfree", cfOrderId: "cf-order", paymentSessionId: "session", amountPaise: 10_000, currency: "INR" };
  let createdAttempt;
  const rawBody = JSON.stringify({
    type: "PAYMENT_USER_DROPPED_WEBHOOK",
    data: { order: { order_id: "CC123", cf_order_id: "cf-order" }, payment: { cf_payment_id: "payment-2", payment_status: "USER_DROPPED", payment_amount: 100, payment_currency: "INR" } },
  });
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = crypto.createHmac("sha256", process.env.CASHFREE_CLIENT_SECRET).update(`${timestamp}${rawBody}`).digest("base64");

  Order.findOne = async () => order;
  Order.updateOne = async () => {};
  PaymentTransaction.findById = async () => previousAttempt;
  PaymentTransaction.findOne = async () => null;
  PaymentTransaction.countDocuments = async () => 1;
  PaymentTransaction.create = async (values) => {
    createdAttempt = { ...values, _id: "attempt-2", status: "pending", save: async () => {} };
    return createdAttempt;
  };
  try {
    await cashfreeWebhook(
      { body: Buffer.from(rawBody), get: (header) => header === "x-webhook-signature" ? signature : timestamp },
      { status: () => ({ json: () => {} }), json: () => {} },
    );
    assert.equal(previousAttempt.cfPaymentId, "payment-1");
    assert.equal(createdAttempt.attemptNumber, 2);
    assert.equal(createdAttempt.cfPaymentId, "payment-2");
    assert.equal(createdAttempt.status, "user_dropped");
  } finally {
    Order.findOne = originalFindOrder;
    Order.updateOne = originalUpdateOrder;
    PaymentTransaction.findById = originalFindTransaction;
    PaymentTransaction.findOne = originalFindPayment;
    PaymentTransaction.countDocuments = originalCount;
    PaymentTransaction.create = originalCreate;
  }
});

test("PENDING keeps the order and stock reservation active", async () => {
  const originalFindOrder = Order.findOne;
  const originalFindTransaction = PaymentTransaction.findById;
  const originalFindPayment = PaymentTransaction.findOne;
  const order = { _id: "order-id", orderNumber: "CC123", status: "pending_payment", activePaymentTransaction: "payment-id", pricing: { currency: "INR" } };
  const transaction = { status: "failed", amountPaise: 10_000, currency: "INR", cfOrderId: "cf-order", save: async () => {} };
  const rawBody = JSON.stringify({
    type: "PAYMENT_PENDING_WEBHOOK",
    data: { order: { order_id: "CC123", cf_order_id: "cf-order" }, payment: { cf_payment_id: "payment-123", payment_status: "PENDING", payment_amount: 100, payment_currency: "INR" } },
  });
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = crypto.createHmac("sha256", process.env.CASHFREE_CLIENT_SECRET).update(`${timestamp}${rawBody}`).digest("base64");

  Order.findOne = async () => order;
  PaymentTransaction.findById = async () => transaction;
  PaymentTransaction.findOne = async () => null;
  try {
    await cashfreeWebhook(
      { body: Buffer.from(rawBody), get: (header) => header === "x-webhook-signature" ? signature : timestamp },
      { status: () => ({ json: () => {} }), json: () => {} },
    );
    assert.equal(order.status, "pending_payment");
    assert.equal(transaction.status, "pending");
  } finally {
    Order.findOne = originalFindOrder;
    PaymentTransaction.findById = originalFindTransaction;
    PaymentTransaction.findOne = originalFindPayment;
  }
});

test("currency mismatches are rejected before a webhook changes payment state", async () => {
  const originalFindOrder = Order.findOne;
  const originalFindTransaction = PaymentTransaction.findById;
  const order = { _id: "order-id", orderNumber: "CC123", status: "pending_payment", activePaymentTransaction: "payment-id", pricing: { currency: "INR" } };
  const transaction = { status: "created", amountPaise: 10_000, currency: "INR", cfOrderId: "cf-order", save: async () => {} };
  const rawBody = JSON.stringify({
    type: "PAYMENT_PENDING_WEBHOOK",
    data: { order: { order_id: "CC123", cf_order_id: "cf-order" }, payment: { cf_payment_id: "payment-123", payment_status: "PENDING", payment_amount: 100, payment_currency: "USD" } },
  });
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = crypto.createHmac("sha256", process.env.CASHFREE_CLIENT_SECRET).update(`${timestamp}${rawBody}`).digest("base64");
  let statusCode;

  Order.findOne = async () => order;
  PaymentTransaction.findById = async () => transaction;
  try {
    await cashfreeWebhook(
      { body: Buffer.from(rawBody), get: (header) => header === "x-webhook-signature" ? signature : timestamp },
      { status: (code) => { statusCode = code; return { json: () => {} }; }, json: () => {} },
    );
    assert.equal(statusCode, 400);
    assert.equal(transaction.status, "created");
  } finally {
    Order.findOne = originalFindOrder;
    PaymentTransaction.findById = originalFindTransaction;
  }
});

test("a pending payment later failed by Cashfree records one throttled email event", async () => {
  const originalFindOrder = Order.findOne;
  const originalFindTransaction = PaymentTransaction.findById;
  const originalFindPayment = PaymentTransaction.findOne;
  const originalExists = PaymentTransaction.exists;
  const originalOutboxUpdate = OutboxEvent.updateOne;
  const order = { _id: "order-id", orderNumber: "CC123", status: "pending_payment", activePaymentTransaction: "payment-id", pricing: { currency: "INR" } };
  const transaction = { _id: "payment-id", status: "pending", amountPaise: 10_000, currency: "INR", cfOrderId: "cf-order", save: async () => {} };
  const rawBody = JSON.stringify({
    type: "PAYMENT_FAILED_WEBHOOK",
    data: { order: { order_id: "CC123", cf_order_id: "cf-order" }, payment: { cf_payment_id: "payment-123", payment_status: "FAILED", payment_amount: 100, payment_currency: "INR" } },
  });
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = crypto.createHmac("sha256", process.env.CASHFREE_CLIENT_SECRET).update(`${timestamp}${rawBody}`).digest("base64");
  let outbox;

  Order.findOne = async () => order;
  PaymentTransaction.findById = async () => transaction;
  PaymentTransaction.findOne = async () => null;
  PaymentTransaction.exists = async () => null;
  OutboxEvent.updateOne = async (filter, update) => { outbox = { filter, update }; };
  try {
    await cashfreeWebhook(
      { body: Buffer.from(rawBody), get: (header) => header === "x-webhook-signature" ? signature : timestamp },
      { status: () => ({ json: () => {} }), json: () => {} },
    );
    assert.equal(transaction.status, "failed");
    assert.equal(outbox.filter.dedupeKey, "PAYMENT_FAILED:order-id");
    assert.equal(outbox.update.$setOnInsert.type, "PAYMENT_FAILED");
  } finally {
    Order.findOne = originalFindOrder;
    PaymentTransaction.findById = originalFindTransaction;
    PaymentTransaction.findOne = originalFindPayment;
    PaymentTransaction.exists = originalExists;
    OutboxEvent.updateOne = originalOutboxUpdate;
  }
});

test("a signed Cashfree auto-refund resolves only the reviewed duplicate payment", async () => {
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
  const order = { _id: "order-id", status: "payment_review_required", paymentStatus: "paid", paymentTransaction: "payment-1", pricing: { currency: "INR" } };
  const duplicatePayment = { _id: "payment-2", amountPaise: 10_000, status: "review_required" };
  const rawBody = JSON.stringify({
    type: "AUTO_REFUND_STATUS_WEBHOOK",
    data: { auto_refund: { order_id: "CC123", refund_type: "PAYMENT_AUTO_REFUND", refund_status: "SUCCESS", refund_amount: 100, refund_currency: "INR", cf_payment_id: "payment-2", cf_refund_id: "auto-refund-1" } },
  });
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = crypto.createHmac("sha256", process.env.CASHFREE_CLIENT_SECRET).update(`${timestamp}${rawBody}`).digest("base64");
  let createdRefund;
  let paymentUpdate;
  let statusCode;
  Order.findOne = async () => order;
  PaymentTransaction.findOne = async () => duplicatePayment;
  PaymentTransaction.findOneAndUpdate = async (...args) => {
    paymentUpdate = args;
    return duplicatePayment;
  };
  Refund.findOne = async () => null;
  Refund.create = async (values) => {
    createdRefund = { ...values, _id: "refund-1" };
    return createdRefund;
  };
  Refund.findOneAndUpdate = async (_filter, update) => ({ ...createdRefund, ...update.$set });
  Refund.findById = async () => createdRefund;
  Refund.updateOne = async () => {};
  OutboxEvent.updateOne = async () => {};
  try {
    await cashfreeWebhook(
      { body: Buffer.from(rawBody), get: (header) => header === "x-webhook-signature" ? signature : timestamp },
      { status: (code) => { statusCode = code; return { json: () => {} }; }, json: () => {} },
    );
    assert.equal(statusCode, 200);
    assert.equal(createdRefund.paymentTransaction, "payment-2");
    assert.equal(paymentUpdate[0]._id, "payment-2");
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

test("duplicate Cashfree webhooks do not process the order twice", async () => {
  const originalFindOrder = Order.findOne;
  const rawBody = JSON.stringify({ type: "PAYMENT_FAILED_WEBHOOK", data: { order: { order_id: "CC123" }, payment: { cf_payment_id: "payment-123", payment_status: "FAILED" } } });
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = crypto.createHmac("sha256", process.env.CASHFREE_CLIENT_SECRET).update(`${timestamp}${rawBody}`).digest("base64");
  let orderLookedUp = false;
  let duplicateUpdate;

  PaymentWebhookEvent.create = async () => { const error = new Error("duplicate"); error.code = 11000; throw error; };
  PaymentWebhookEvent.findOne = async () => ({ _id: "webhook-1", status: "processed" });
  PaymentWebhookEvent.updateOne = async (...args) => { duplicateUpdate = args; };
  Order.findOne = async () => { orderLookedUp = true; };
  try {
    await cashfreeWebhook(
      { body: Buffer.from(rawBody), get: (header) => header === "x-webhook-signature" ? signature : timestamp },
      { status: () => ({ json: () => {} }), json: () => {} },
    );
    assert.equal(orderLookedUp, false);
    assert.deepEqual(duplicateUpdate, [{ _id: "webhook-1" }, { $inc: { duplicateCount: 1 } }]);
  } finally {
    Order.findOne = originalFindOrder;
  }
});

test("invalid and replayed webhook signatures are rejected before order lookup", async () => {
  const originalFindOrder = Order.findOne;
  const rawBody = JSON.stringify({ type: "PAYMENT_SUCCESS_WEBHOOK", data: { order: { order_id: "CC123" }, payment: { cf_payment_id: "payment-123", payment_status: "SUCCESS" } } });
  let orderLookedUp = false;
  Order.findOne = async () => { orderLookedUp = true; };
  try {
    for (const [signature, timestamp] of [
      ["invalid", String(Math.floor(Date.now() / 1000))],
      [crypto.createHmac("sha256", process.env.CASHFREE_CLIENT_SECRET).update(`${Math.floor(Date.now() / 1000) - 10_000}${rawBody}`).digest("base64"), String(Math.floor(Date.now() / 1000) - 10_000)],
    ]) {
      let statusCode;
      await cashfreeWebhook(
        { body: Buffer.from(rawBody), get: (header) => header === "x-webhook-signature" ? signature : timestamp },
        { status: (code) => { statusCode = code; return { json: () => {} }; }, json: () => {} },
      );
      assert.equal(statusCode, 400);
    }
    assert.equal(orderLookedUp, false);
  } finally {
    Order.findOne = originalFindOrder;
  }
});
