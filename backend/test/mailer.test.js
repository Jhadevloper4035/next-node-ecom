process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret";
process.env.JWT_REFRESH_SECRET ||= "test-refresh-secret";
process.env.SMTP_HOST = "";

const test = require("node:test");
const assert = require("node:assert/strict");

const { sendMail } = require("../src/config/mailer");

test("sendMail fails when SMTP is not configured", async () => {
  await assert.rejects(
    sendMail({ to: "user@example.com", subject: "OTP", html: "<p>123456</p>" }),
    /SMTP_HOST not set/,
  );
});
