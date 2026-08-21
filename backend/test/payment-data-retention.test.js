process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret";

const assert = require("node:assert/strict");
const test = require("node:test");
const PaymentWebhookEvent = require("../src/models/paymentWebhookEvent.model");
const PaymentTransaction = require("../src/models/paymentTransaction.model");
const Refund = require("../src/models/refund.model");
const { redactExpiredPaymentPayloads } = require("../src/services/payment-data-retention.service");

test("expired payment payloads are removed while audit records remain", async () => {
  const originals = [PaymentWebhookEvent.updateMany, PaymentTransaction.updateMany, Refund.updateMany];
  const calls = [];
  PaymentWebhookEvent.updateMany = async (...args) => { calls.push(args); return { modifiedCount: 1 }; };
  PaymentTransaction.updateMany = async (...args) => { calls.push(args); return { modifiedCount: 2 }; };
  Refund.updateMany = async (...args) => { calls.push(args); return { modifiedCount: 3 }; };
  try {
    assert.equal(await redactExpiredPaymentPayloads(new Date("2026-08-20T00:00:00.000Z")), 6);
    assert.deepEqual(calls[0][1], { $set: { rawPayload: "" } });
    assert.deepEqual(calls[1][1], { $set: { rawWebhookPayload: "" } });
    assert.deepEqual(calls[2][1], { $set: { rawResponse: "" } });
  } finally {
    [PaymentWebhookEvent.updateMany, PaymentTransaction.updateMany, Refund.updateMany] = originals;
  }
});
