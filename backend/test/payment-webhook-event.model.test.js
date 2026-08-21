process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret";

const assert = require("node:assert/strict");
const test = require("node:test");
const PaymentWebhookEvent = require("../src/models/paymentWebhookEvent.model");

test("webhook events use a durable gateway dedupe key", () => {
  assert.ok(PaymentWebhookEvent.schema.indexes().some(([keys, options]) => keys.gateway === 1 && keys.dedupeKey === 1 && options.unique));
  assert.ok(PaymentWebhookEvent.schema.path("status").enumValues.includes("processed"));
  assert.equal(PaymentWebhookEvent.schema.path("signatureValid").isRequired, true);
  assert.equal(typeof PaymentWebhookEvent.schema.path("receivedAt").defaultValue, "function");
  assert.equal(PaymentWebhookEvent.schema.path("rawPayload").options.select, false);
  assert.equal(PaymentWebhookEvent.schema.path("duplicateCount").defaultValue, 0);
});
