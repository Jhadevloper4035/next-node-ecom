const assert = require("node:assert/strict");
const test = require("node:test");
const { verificationEmailTemplate, passwordResetEmailTemplate, passwordChangedEmailTemplate } = require("../src/utils/emailTemplates");

test("auth emails share Curve & Comfort branding and safely render links", () => {
  const emails = [verificationEmailTemplate({ verificationLink: 'https://example.com/?q="<script>', expiresMinutes: 30 }), passwordResetEmailTemplate({ resetLink: "https://example.com/reset", expiresMinutes: 15 }), passwordChangedEmailTemplate()];
  for (const html of emails) assert.match(html, /Curve &amp; Comfort/);
  assert.match(emails[0], /&quot;&lt;script&gt;/);
  assert.match(emails[1], /Reset Password/);
});
