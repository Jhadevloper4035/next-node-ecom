const assert = require("node:assert/strict");
const test = require("node:test");
const { redactPaymentPayload } = require("../src/utils/paymentPayload");

test("payment payload retention redacts payment credentials", () => {
  const payload = JSON.parse(redactPaymentPayload(JSON.stringify({
    card_number: "4111111111111111",
    cvv: "123",
    otp: "456789",
    upi_pin: "9999",
    payment: { payment_status: "SUCCESS" },
  })));
  assert.equal(payload.card_number, "[REDACTED]");
  assert.equal(payload.cvv, "[REDACTED]");
  assert.equal(payload.otp, "[REDACTED]");
  assert.equal(payload.upi_pin, "[REDACTED]");
  assert.equal(payload.payment.payment_status, "SUCCESS");
});
