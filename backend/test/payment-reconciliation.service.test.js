process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret";

const assert = require("node:assert/strict");
const test = require("node:test");
const { isCurrentConfirmedPayment, reconciliationDecision, successfulPayments, pendingReviewDue } = require("../src/services/payment-reconciliation.service");

const order = { pricing: { advancePaise: 10_000, currency: "INR" } };

test("two different successful Cashfree payment IDs are sent to duplicate-payment review", () => {
  const payment = { cf_payment_id: "payment-1", payment_amount: 100, payment_currency: "INR" };
  assert.equal(reconciliationDecision({ order, payment, successCount: 1 }), "confirm");
  assert.equal(reconciliationDecision({ order, payment, successCount: 2 }), "duplicate_payment");
  assert.equal(reconciliationDecision({ order, payment: { ...payment, payment_amount: 99 }, successCount: 1 }), "amount_mismatch");
  assert.equal(reconciliationDecision({ order, payment: { ...payment, payment_currency: "USD" }, successCount: 1 }), "currency_mismatch");
  assert.equal(reconciliationDecision({ order, payment: { ...payment, payment_currency: "" }, successCount: 1 }), "currency_mismatch");
  assert.deepEqual(successfulPayments([{ payment_status: "FAILED" }, { payment_status: "SUCCESS", payment_completion_time: "2026-01-02" }]).map((item) => item.payment_status), ["SUCCESS"]);
});

test("only old pending attempts are sent to support review", () => {
  const now = new Date("2026-08-20T12:00:00.000Z");
  assert.equal(pendingReviewDue({ createdAt: new Date("2026-08-20T11:00:00.000Z") }, { pendingSince: new Date("2026-08-20T11:49:00.000Z") }, now), true);
  assert.equal(pendingReviewDue({ createdAt: new Date("2026-08-20T11:00:00.000Z") }, { pendingSince: new Date("2026-08-20T11:55:00.000Z") }, now), false);
});

test("the original verified payment keeps an already confirmed order confirmed", () => {
  const payment = { cf_payment_id: "payment-1" };
  const attempt = { _id: "attempt-1", cfPaymentId: "payment-1" };
  assert.equal(isCurrentConfirmedPayment({ status: "confirmed", paymentTransaction: "attempt-1" }, attempt, payment, 1), true);
  assert.equal(isCurrentConfirmedPayment({ status: "confirmed", paymentTransaction: { _id: "attempt-1" } }, attempt, payment, 1), true);
  assert.equal(isCurrentConfirmedPayment({ status: "pending_payment", paymentTransaction: "attempt-1" }, attempt, payment, 1), false);
  assert.equal(isCurrentConfirmedPayment({ status: "confirmed", paymentTransaction: "attempt-1" }, attempt, payment, 2), false);
});
