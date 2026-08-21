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

test("production payment settings require Cashfree and HTTPS", () => {
  const { validateProductionPaymentConfig } = require("../src/config/env");
  const secureConfig = {
    nodeEnv: "production",
    cashfreeClientId: "client",
    cashfreeClientSecret: "secret",
    cashfreeEnvironment: "production",
    cashfreeWebhookUrl: "https://api.example.com/webhooks/cashfree",
    frontendUrl: "https://shop.example.com",
    supportEmail: "support@example.com",
  };
  assert.doesNotThrow(() => validateProductionPaymentConfig(secureConfig));
  assert.throws(() => validateProductionPaymentConfig({ ...secureConfig, cashfreeEnvironment: "sandbox" }), /CASHFREE_ENVIRONMENT/);
  assert.throws(() => validateProductionPaymentConfig({ ...secureConfig, frontendUrl: "http://shop.example.com" }), /HTTPS FRONTEND_URL/);
  assert.throws(() => validateProductionPaymentConfig({ ...secureConfig, supportEmail: "" }), /SUPPORT_EMAIL/);
});
