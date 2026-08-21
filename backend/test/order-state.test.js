process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret";

const assert = require("node:assert/strict");
const test = require("node:test");
const Order = require("../src/models/order.model");
const { transitions } = require("../src/services/checkout.service");

test("every order state has explicit transitions and terminal payment states cannot regress", () => {
  const states = Order.schema.path("status").enumValues;
  assert.deepEqual(Object.keys(transitions).sort(), [...states].sort());
  assert.ok(transitions.confirmed.includes("cancel_requested"));
  assert.ok(transitions.refund_pending.includes("partially_refunded"));
  assert.ok(transitions.refund_pending.includes("refunded"));
  assert.equal(transitions.confirmed.includes("pending_payment"), false);
  assert.equal(transitions.delivered.includes("pending_payment"), false);
});
