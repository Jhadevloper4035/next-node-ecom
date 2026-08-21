process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret";

const assert = require("node:assert/strict");
const test = require("node:test");
const { paymentAmountPaise, paymentVerificationError } = require("../src/services/payment-verification.service");

const order = { orderNumber: "CC123", pricing: { advancePaise: 10_000, currency: "INR" } };
const attempt = { amountPaise: 10_000, currency: "INR", cfOrderId: "cf-order-123" };
const payment = { cf_payment_id: "payment-123", payment_amount: "100.00", payment_currency: "INR" };

test("Cashfree payment verification requires matching order, currency, and exact paise", () => {
  assert.equal(paymentAmountPaise("100.001"), null);
  assert.equal(paymentVerificationError({ order, attempt, payment, merchantOrderId: "CC123", cashfreeOrderId: "cf-order-123" }), null);
  assert.equal(paymentVerificationError({ order, attempt, payment: { ...payment, payment_currency: "USD" }, merchantOrderId: "CC123" }), "Payment currency mismatch");
  assert.equal(paymentVerificationError({ order, attempt, payment: { ...payment, payment_amount: "99.99" }, merchantOrderId: "CC123" }), "Payment amount mismatch");
  assert.equal(paymentVerificationError({ order, attempt, payment, merchantOrderId: "CC999" }), "Payment order mismatch");
  assert.equal(paymentVerificationError({ order, attempt, payment, merchantOrderId: "CC123", cashfreeOrderId: "cf-order-999" }), "Cashfree order mismatch");
});
