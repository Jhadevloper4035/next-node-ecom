function verificationEmailTemplate({ verificationLink, expiresMinutes }) {
  const safeLink = String(verificationLink);
  return `
    <div style="margin:0;padding:32px 16px;background:#f5f5f3;font-family:Arial,Helvetica,sans-serif;color:#181818;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-collapse:separate;border-spacing:0;">
        <tr>
          <td style="padding:28px 40px;border-bottom:1px solid #e8e5df;text-align:center;">
            <img src="https://curve-comfort.com/images/logo/logo.png" alt="Curve &amp; Comfort" width="144" style="display:inline-block;width:144px;height:auto;border:0;" />
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#8a6c4a;">Welcome to Curve &amp; Comfort</p>
            <h1 style="margin:0 0 16px;font-size:28px;line-height:34px;font-weight:600;color:#181818;">Verify your email</h1>
            <p style="margin:0 0 28px;font-size:16px;line-height:25px;color:#55504a;">Thank you for creating an account. Please confirm your email address to start shopping with us.</p>
            <p style="margin:0 0 28px;"><a href="${safeLink}" style="display:inline-block;padding:14px 24px;background:#181818;color:#ffffff;font-size:15px;font-weight:700;line-height:20px;text-decoration:none;">Verify Email Address</a></p>
            <p style="margin:0 0 20px;font-size:14px;line-height:22px;color:#55504a;">For your security, this link expires in <strong>${expiresMinutes} minutes</strong>.</p>
            <p style="margin:0;padding-top:20px;border-top:1px solid #e8e5df;font-size:13px;line-height:20px;color:#817b74;">If you did not create a Curve &amp; Comfort account, you can safely ignore this email.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 40px;background:#181818;text-align:center;font-size:12px;line-height:18px;color:#ffffff;">Curve &amp; Comfort &middot; Furniture made for comfortable living</td>
        </tr>
      </table>
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
