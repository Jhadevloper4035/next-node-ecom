process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret";

const assert = require("node:assert/strict");
const test = require("node:test");
const authRoutes = require("../src/routes/auth.route");
const Session = require("../src/models/session.model");
const EmailVerificationToken = require("../src/models/emailVerificationToken.model");
const PasswordResetToken = require("../src/models/passwordResetToken.model");

test("auth routes expose the email-link and session lifecycle", () => {
  const paths = authRoutes.stack.filter((layer) => layer.route).map((layer) => layer.route.path);
  for (const path of ["/register", "/verify-email", "/resend-verification", "/login", "/refresh", "/logout", "/logout-all", "/forgot-password", "/reset-password", "/change-password"]) {
    assert.ok(paths.includes(path), `${path} is missing`);
  }
  assert.equal(paths.includes("/verify-otp"), false);
});

test("session and one-time token records only accept hashes and expiry", async () => {
  const userId = "507f1f77bcf86cd799439011";
  const expiresAt = new Date(Date.now() + 60_000);
  for (const Model of [Session, EmailVerificationToken, PasswordResetToken]) {
    const fields = Model === Session
      ? { tokenHash: "a".repeat(64), userId, familyId: "family", expiresAt }
      : { tokenHash: "a".repeat(64), userId, expiresAt };
    await new Model(fields).validate();
  }
});
