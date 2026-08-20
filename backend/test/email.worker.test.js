process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret";

const assert = require("node:assert/strict");
const test = require("node:test");
const { emailJobOptions, emailPriority } = require("../src/queues/email.queue");
const { buildEmail } = require("../src/workers/email.worker");

test("email worker supports each queued transactional email type", () => {
  assert.deepEqual(emailPriority, { verification: 1, passwordReset: 1, passwordChanged: 2, orderConfirmed: 2 });
  assert.deepEqual(emailJobOptions.backoff, { type: "exponential", delay: 1000 });
  assert.equal(emailJobOptions.attempts, 5);
  assert.match(buildEmail("verification", { verificationLink: "https://example.com/verify", expiresMinutes: 30 }).html, /Verify your email/);
  assert.match(buildEmail("passwordReset", { resetLink: "https://example.com/reset", expiresMinutes: 15 }).html, /Reset your password/);
  assert.match(buildEmail("passwordChanged").html, /password was changed/);
  assert.match(buildEmail("orderConfirmed", { order: { orderNumber: "CC1", items: [], pricing: { totalPaise: 100 }, addressSnapshot: {} } }).html, /Order CC1 confirmed/);
});
