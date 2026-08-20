process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret";

const assert = require("node:assert/strict");
const test = require("node:test");

test("checkout expiry stays above Cashfree's strict 15-minute minimum", () => {
  const previousValue = process.env.CHECKOUT_EXPIRY_MINUTES;
  process.env.CHECKOUT_EXPIRY_MINUTES = "15";
  delete require.cache[require.resolve("../src/config/env")];

  try {
    assert.equal(require("../src/config/env").env.checkoutExpiryMinutes, 16);
  } finally {
    if (previousValue === undefined) delete process.env.CHECKOUT_EXPIRY_MINUTES;
    else process.env.CHECKOUT_EXPIRY_MINUTES = previousValue;
  }
});
