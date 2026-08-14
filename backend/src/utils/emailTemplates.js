const escapeHtml = (value) => String(value || "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

function authEmailTemplate({ eyebrow, title, message, action, detail, notice }) {
  const button = action ? `<p style="margin:0 0 28px;"><a href="${escapeHtml(action.href)}" style="display:inline-block;padding:14px 24px;background:#181818;color:#ffffff;font-size:15px;font-weight:700;line-height:20px;text-decoration:none;">${escapeHtml(action.label)}</a></p>` : "";
  const fallback = action ? `<p style="margin:0;font-size:12px;line-height:18px;color:#817b74;word-break:break-all;">Button not working? Copy this link: ${escapeHtml(action.href)}</p>` : "";
  return `<div style="margin:0;padding:32px 16px;background:#f5f5f3;font-family:Arial,Helvetica,sans-serif;color:#181818;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-collapse:separate;border-spacing:0;"><tr><td style="padding:28px 40px;border-bottom:1px solid #e8e5df;text-align:center;"><img src="https://curve-comfort.com/images/logo/logo.png" alt="Curve &amp; Comfort" width="144" style="display:inline-block;width:144px;height:auto;border:0;" /></td></tr><tr><td style="padding:40px;"><p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#8a6c4a;">${escapeHtml(eyebrow)}</p><h1 style="margin:0 0 16px;font-size:28px;line-height:34px;font-weight:600;color:#181818;">${escapeHtml(title)}</h1><p style="margin:0 0 28px;font-size:16px;line-height:25px;color:#55504a;">${escapeHtml(message)}</p>${button}<p style="margin:0 0 20px;font-size:14px;line-height:22px;color:#55504a;">${escapeHtml(detail)}</p><p style="margin:0;padding-top:20px;border-top:1px solid #e8e5df;font-size:13px;line-height:20px;color:#817b74;">${escapeHtml(notice)}</p>${fallback}</td></tr><tr><td style="padding:20px 40px;background:#181818;text-align:center;font-size:12px;line-height:18px;color:#ffffff;">Curve &amp; Comfort &middot; Furniture made for comfortable living</td></tr></table></div>`;
}

function verificationEmailTemplate({ verificationLink, expiresMinutes }) {
  return authEmailTemplate({ eyebrow: "Welcome to Curve & Comfort", title: "Verify your email", message: "Thank you for creating an account. Please confirm your email address to start shopping with us.", action: { href: verificationLink, label: "Verify Email Address" }, detail: `For your security, this link expires in ${expiresMinutes} minutes.`, notice: "If you did not create a Curve & Comfort account, you can safely ignore this email." });
}

function passwordResetEmailTemplate({ resetLink, expiresMinutes }) {
  return authEmailTemplate({ eyebrow: "Account security", title: "Reset your password", message: "We received a request to reset the password for your Curve & Comfort account.", action: { href: resetLink, label: "Reset Password" }, detail: `For your security, this link expires in ${expiresMinutes} minutes.`, notice: "If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged." });
}

function passwordChangedEmailTemplate() {
  return authEmailTemplate({ eyebrow: "Account security", title: "Your password was changed", message: "The password for your Curve & Comfort account was changed successfully.", detail: "You have been signed out of other devices to keep your account secure.", notice: "If you did not make this change, reset your password immediately and contact our support team." });
}

function orderConfirmedEmailTemplate({ order }) {
  const address = order.addressSnapshot;
  const items = order.items.map((item) => `<li>${escapeHtml(item.title)} × ${item.quantity}</li>`).join("");
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:16px;"><h2>Order ${escapeHtml(order.orderNumber)} confirmed</h2><ul>${items}</ul><p>Total: ₹${(order.pricing.totalPaise / 100).toFixed(2)}</p><p>${[address.line1, address.line2, address.city, address.state, address.postalCode].filter(Boolean).map(escapeHtml).join(", ")}</p></div>`;
}

module.exports = { verificationEmailTemplate, passwordResetEmailTemplate, passwordChangedEmailTemplate, orderConfirmedEmailTemplate };
