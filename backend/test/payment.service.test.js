process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret";
process.env.CASHFREE_CLIENT_SECRET = "webhook-test-secret";

const crypto = require("crypto");
const assert = require("node:assert/strict");
const test = require("node:test");
const { verifyCashfreeWebhook } = require("../src/services/payment.service");

test("Cashfree webhook verification requires the signed raw payload", () => {
  const rawBody = '{"type":"PAYMENT_SUCCESS_WEBHOOK"}';
  const timestamp = "1720000000";
  const signature = crypto.createHmac("sha256", process.env.CASHFREE_CLIENT_SECRET).update(`${timestamp}${rawBody}`).digest("base64");
  assert.equal(verifyCashfreeWebhook({ signature, timestamp, rawBody }), true);
  assert.equal(verifyCashfreeWebhook({ signature, timestamp, rawBody: "{}" }), false);
});
