process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret";

const assert = require("node:assert/strict");
const test = require("node:test");
const { emailJobOptions, emailPriority } = require("../src/queues/email.queue");
const { buildEmail } = require("../src/workers/email.worker");

test("email worker supports each queued transactional email type", () => {
  assert.deepEqual(emailPriority, { verification: 1, passwordReset: 1, passwordChanged: 2, orderReserved: 2, paymentFailed: 2, checkoutExpired: 2, orderConfirmed: 2, refundInitiated: 2, refundCompleted: 2, duplicatePaymentResolvedSupport: 1, refundFailed: 1 });
  assert.deepEqual(emailJobOptions.backoff, { type: "exponential", delay: 1000 });
  assert.equal(emailJobOptions.attempts, 5);
  assert.match(buildEmail("verification", { verificationLink: "https://example.com/verify", expiresMinutes: 30 }).html, /Verify your email/);
  assert.match(buildEmail("passwordReset", { resetLink: "https://example.com/reset", expiresMinutes: 15 }).html, /Reset your password/);
  assert.match(buildEmail("passwordChanged").html, /password was changed/);
  const orderEmail = buildEmail("orderConfirmed", { order: { orderNumber: "CC1", items: [], pricing: { totalPaise: 100 }, addressSnapshot: {} } }).html;
  assert.match(orderEmail, /Your order is confirmed/);
  assert.match(orderEmail, /Order #CC1/);
  const reservedOrderEmail = buildEmail("orderReserved", { order: { orderNumber: "CC1", expiresAt: "2026-08-22T12:00:00.000Z", items: [], pricing: { totalPaise: 100 }, addressSnapshot: {} } }).html;
  assert.match(reservedOrderEmail, /Your items are reserved/);
  assert.match(reservedOrderEmail, /my-account-orders-details\?order_id=CC1/);
  const paymentFailedEmail = buildEmail("paymentFailed", { order: { orderNumber: "CC1" }, attempt: { amountPaise: 10_000 } }).html;
  assert.match(paymentFailedEmail, /Complete pending order/);
  assert.match(paymentFailedEmail, /my-account-orders-details\?order_id=CC1/);
  assert.match(buildEmail("checkoutExpired", { order: { orderNumber: "CC1" } }).html, /reservation has ended/i);
  assert.match(buildEmail("refundCompleted", { order: { orderNumber: "CC1" }, refund: { refundId: "RF1", amountPaise: 100, reason: "Duplicate payment" } }).html, /refund has been completed/);
  assert.match(buildEmail("duplicatePaymentResolvedSupport", { order: { orderNumber: "CC1" }, refund: { refundId: "RF1", amountPaise: 100 } }).html, /Duplicate payment refunded/);
});
