process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret";

const assert = require("node:assert/strict");
const test = require("node:test");
const PaymentTransaction = require("../src/models/paymentTransaction.model");

test("payment transactions allow multiple numbered attempts for one order", () => {
  assert.equal(PaymentTransaction.schema.path("order").options.unique, undefined);
  assert.equal(PaymentTransaction.schema.path("cfOrderId").options.unique, undefined);
  assert.ok(PaymentTransaction.schema.indexes().some(([keys, options]) => keys.order === 1 && keys.attemptNumber === 1 && options.unique));
  assert.ok(PaymentTransaction.schema.path("status").enumValues.includes("user_dropped"));
  assert.equal(PaymentTransaction.schema.path("rawWebhookPayload").options.select, false);
});
