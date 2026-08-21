process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret";

const assert = require("node:assert/strict");
const test = require("node:test");
const EmailEvent = require("../src/models/emailEvent.model");
const Order = require("../src/models/order.model");
const PaymentTransaction = require("../src/models/paymentTransaction.model");
const mailer = require("../src/config/mailer");
const originalSendMail = mailer.sendMail;
let sent = 0;
let sendError = null;
mailer.sendMail = async () => {
  if (sendError) throw sendError;
  sent += 1;
};
const { sendEmailEvent } = require("../src/workers/email.worker");

test("durable email events store delivery state and a dedupe key", () => {
  const paths = EmailEvent.schema.paths;
  assert.ok(paths.dedupeKey.options.unique);
  assert.equal(paths.attemptCount.options.default, 0);
  assert.equal(paths.sentAt.options.default, null);
  assert.ok(paths.finalError);
});

test("a failed-payment email is skipped when the order later has a paid attempt", async () => {
  const originals = {
    claim: EmailEvent.findOneAndUpdate,
    update: EmailEvent.updateOne,
    findOrder: Order.findById,
    findPayment: PaymentTransaction.findById,
    exists: PaymentTransaction.exists,
  };
  const emailEvent = { _id: "email-1", type: "paymentFailed", order: "order-1", paymentTransaction: "payment-1", to: "customer@example.com", data: { order: { orderNumber: "CC1" }, attempt: { amountPaise: 100 } } };
  const updates = [];
  EmailEvent.findOneAndUpdate = async () => emailEvent;
  EmailEvent.updateOne = async (...args) => { updates.push(args); };
  Order.findById = async () => ({ _id: "order-1", status: "pending_payment", expiresAt: new Date(Date.now() + 60_000), activePaymentTransaction: "payment-1" });
  PaymentTransaction.findById = async () => ({ _id: "payment-1", status: "failed", cashfreeStatus: "FAILED" });
  PaymentTransaction.exists = async () => ({ _id: "paid-attempt" });
  sent = 0;
  try {
    assert.equal(await sendEmailEvent("email-1"), false);
    assert.equal(sent, 0);
    assert.equal(updates[0][1].$set.status, "ignored");
  } finally {
    EmailEvent.findOneAndUpdate = originals.claim;
    EmailEvent.updateOne = originals.update;
    Order.findById = originals.findOrder;
    PaymentTransaction.findById = originals.findPayment;
    PaymentTransaction.exists = originals.exists;
  }
});

test("SMTP failures are retained on the durable email event for recovery", async () => {
  const originalClaim = EmailEvent.findOneAndUpdate;
  const originalUpdate = EmailEvent.updateOne;
  const emailEvent = { _id: "email-1", type: "orderConfirmed", to: "customer@example.com", data: { order: { orderNumber: "CC1", items: [], pricing: { totalPaise: 100 }, addressSnapshot: {} } } };
  const updates = [];
  EmailEvent.findOneAndUpdate = async () => emailEvent;
  EmailEvent.updateOne = async (...args) => { updates.push(args); };
  sendError = new Error("SMTP unavailable");
  try {
    await assert.rejects(sendEmailEvent("email-1"), /SMTP unavailable/);
    assert.equal(updates.at(-1)[1].$set.status, "failed");
    assert.equal(updates.at(-1)[1].$set.finalError, "SMTP unavailable");
  } finally {
    sendError = null;
    EmailEvent.findOneAndUpdate = originalClaim;
    EmailEvent.updateOne = originalUpdate;
  }
});

test.after(() => {
  mailer.sendMail = originalSendMail;
});
