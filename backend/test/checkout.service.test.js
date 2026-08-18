process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret";

const assert = require("node:assert/strict");
const test = require("node:test");
const { paymentPlan } = require("../src/services/checkout.service");

test("COD always collects a one-third advance and leaves the balance due", () => {
  assert.deepEqual(paymentPlan(10_001, "cod"), { advancePaise: 3_334, balanceDuePaise: 6_667, paymentMethods: "upi,cc,dc" });
  assert.deepEqual(paymentPlan(10_001, "upi"), { advancePaise: 10_001, balanceDuePaise: 0, paymentMethods: "upi" });
});
