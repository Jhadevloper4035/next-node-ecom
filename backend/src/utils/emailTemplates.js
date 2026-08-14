function verificationEmailTemplate({ appName, verificationLink, expiresMinutes }) {
  const safeApp = String(appName || "App");
  const safeLink = String(verificationLink);
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:16px;">
      <h2 style="margin:0 0 12px;">${safeApp} — Email Verification</h2>
      <p style="margin:0 0 12px;">Confirm your email address to finish creating your account.</p>
      <p style="margin:0 0 16px;"><a href="${safeLink}" style="display:inline-block;background:#111827;color:#fff;padding:10px 14px;border-radius:10px;text-decoration:none;">Verify Email</a></p>
      <p style="margin:14px 0 0;color:#444;">This link expires in <strong>${expiresMinutes} minutes</strong>.</p>
      <p style="margin:14px 0 0;color:#666;font-size:12px;">
        If you didn't request this, you can ignore this email.
      </p>
    </div>
  `;
}

function passwordChangedEmailTemplate({ appName }) {
  const safeApp = String(appName || "App");
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:16px;"><h2>${safeApp} — Password Changed</h2><p>Your password was changed. If this was not you, reset your password immediately.</p></div>`;
}

function passwordResetEmailTemplate({ appName, resetLink, expiresMinutes }) {
  const safeApp = String(appName || "App");
  const safeLink = String(resetLink);
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:16px;">
      <h2 style="margin:0 0 12px;">${safeApp} — Password Reset</h2>
      <p style="margin:0 0 12px;">We received a request to reset your password.</p>
      <p style="margin:0 0 12px;">
        Click the button below to reset your password. This link expires in <strong>${expiresMinutes} minutes</strong>.
      </p>
      <p style="margin:0 0 16px;">
        <a href="${safeLink}" style="display:inline-block;background:#111827;color:#fff;padding:10px 14px;border-radius:10px;text-decoration:none;">
          Reset Password
        </a>
      </p>
      <p style="margin:0 0 12px;color:#666;font-size:12px;">
        If you didn't request this, you can ignore this email.
      </p>
      <p style="margin:0;color:#666;font-size:12px;">
        If the button doesn't work, copy and paste this URL into your browser:<br/>
        <span style="word-break:break-all;">${safeLink}</span>
      </p>
    </div>
  `;
}

module.exports = { verificationEmailTemplate, passwordResetEmailTemplate, passwordChangedEmailTemplate };
