process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret";

const assert = require("node:assert/strict");
const test = require("node:test");
const Order = require("../src/models/order.model");
const PaymentTransaction = require("../src/models/paymentTransaction.model");
const Refund = require("../src/models/refund.model");
const EmailEvent = require("../src/models/emailEvent.model");
const { env } = require("../src/config/env");
const { failedPaymentEmailReady, sendEventEmail } = require("../src/workers/event.worker");
const { eventJobId } = require("../src/queues/event.queue");

test("outbox jobs use BullMQ-safe IDs", () => {
  const jobId = eventJobId("event-1", 2);
  assert.equal(jobId, "outbox-event-1-2");
  assert.equal(jobId.includes(":"), false);
});

test("failed payment email is sent after a failed checkout expires, but not after payment", () => {
  const order = { status: "pending_payment", expiresAt: new Date(Date.now() + 60_000), activePaymentTransaction: "failed-attempt" };
  const payment = { _id: "failed-attempt", status: "failed", cashfreeStatus: "FAILED" };
  assert.equal(failedPaymentEmailReady({ order, payment, hasPaidAttempt: null }), true);
  assert.equal(failedPaymentEmailReady({ order, payment, hasPaidAttempt: { _id: "paid" } }), false);
  assert.equal(failedPaymentEmailReady({ order, payment: { ...payment, status: "pending" }, hasPaidAttempt: null }), false);
  assert.equal(failedPaymentEmailReady({ order, payment: { ...payment, status: "user_dropped", cashfreeStatus: "USER_DROPPED" }, hasPaidAttempt: null }), true);
  assert.equal(failedPaymentEmailReady({ order: { ...order, activePaymentTransaction: "newer-attempt" }, payment, hasPaidAttempt: null }), false);
  assert.equal(failedPaymentEmailReady({ order: { ...order, status: "cancelled", expiresAt: new Date(Date.now() - 1) }, payment, hasPaidAttempt: null }), true);
});

test("a resolved duplicate payment queues a support alert", async () => {
  const originals = {
    findOrder: Order.findById,
    findRefund: Refund.findById,
    createEmail: EmailEvent.findOneAndUpdate,
    supportEmail: env.supportEmail,
  };
  let emailUpdate;
  Order.findById = () => ({ populate: async () => ({ _id: "order-1" }) });
  Refund.findById = async () => ({ _id: "refund-1", status: "success", refundId: "RF1", amountPaise: 10_000 });
  EmailEvent.findOneAndUpdate = async (...args) => {
    emailUpdate = args;
    return { _id: "email-1", status: "queued" };
  };
  env.supportEmail = "support@example.com";
  try {
    assert.equal(await sendEventEmail({ _id: "event-1", type: "DUPLICATE_PAYMENT_RESOLVED", order: "order-1", refund: "refund-1" }), true);
    assert.equal(emailUpdate[1].$setOnInsert.to, "support@example.com");
    assert.equal(emailUpdate[1].$setOnInsert.type, "duplicatePaymentResolvedSupport");
  } finally {
    Order.findById = originals.findOrder;
    Refund.findById = originals.findRefund;
    EmailEvent.findOneAndUpdate = originals.createEmail;
    env.supportEmail = originals.supportEmail;
  }
});

test("a confirmed order queues its verified payment reference", async () => {
  const originals = {
    findOrder: Order.findById,
    findPayment: PaymentTransaction.findById,
    createEmail: EmailEvent.findOneAndUpdate,
  };
  let emailUpdate;
  Order.findById = () => ({ populate: async () => ({ _id: "order-1", status: "confirmed", user: { email: "customer@example.com" } }) });
  PaymentTransaction.findById = async () => ({ _id: "payment-1", cfPaymentId: "payment-1234" });
  EmailEvent.findOneAndUpdate = async (...args) => {
    emailUpdate = args;
    return { _id: "email-1", status: "queued" };
  };
  try {
    assert.equal(await sendEventEmail({ _id: "event-1", type: "ORDER_CONFIRMED", order: "order-1", paymentTransaction: "payment-1" }), true);
    assert.equal(emailUpdate[1].$setOnInsert.data.attempt.cfPaymentId, "payment-1234");
  } finally {
    Order.findById = originals.findOrder;
    PaymentTransaction.findById = originals.findPayment;
    EmailEvent.findOneAndUpdate = originals.createEmail;
  }
});
