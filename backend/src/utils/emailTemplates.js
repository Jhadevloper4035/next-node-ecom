const escapeHtml = (value) => String(value || "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
const emailLogoUrl = `${(process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/+$/, "")}/images/logo/logo.png`;

function brandedEmailTemplate({ eyebrow, title, message, content = "", action, detail, notice }) {
  const button = action ? `<p style="margin:0 0 28px;"><a href="${escapeHtml(action.href)}" style="display:inline-block;padding:14px 24px;background:#181818;color:#ffffff;font-size:15px;font-weight:700;line-height:20px;text-decoration:none;">${escapeHtml(action.label)}</a></p>` : "";
  const fallback = action ? `<p style="margin:0;font-size:12px;line-height:18px;color:#817b74;word-break:break-all;">Button not working? Copy this link: ${escapeHtml(action.href)}</p>` : "";
  return `<div style="margin:0;padding:32px 16px;background:#f5f5f3;font-family:Arial,Helvetica,sans-serif;color:#181818;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-collapse:separate;border-spacing:0;"><tr><td style="padding:28px 40px;border-bottom:1px solid #e8e5df;text-align:center;"><img src="${escapeHtml(emailLogoUrl)}" alt="Curve &amp; Comfort" width="144" style="display:inline-block;width:144px;height:auto;border:0;" /></td></tr><tr><td style="padding:40px;"><p style="margin:0 0 12px;font-size:12px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#8a6c4a;">${escapeHtml(eyebrow)}</p><h1 style="margin:0 0 16px;font-size:28px;line-height:34px;font-weight:600;color:#181818;">${escapeHtml(title)}</h1><p style="margin:0 0 28px;font-size:16px;line-height:25px;color:#55504a;">${escapeHtml(message)}</p>${content}${button}<p style="margin:0 0 20px;font-size:14px;line-height:22px;color:#55504a;">${escapeHtml(detail)}</p><p style="margin:0;padding-top:20px;border-top:1px solid #e8e5df;font-size:13px;line-height:20px;color:#817b74;">${escapeHtml(notice)}</p>${fallback}</td></tr><tr><td style="padding:20px 40px;background:#181818;text-align:center;font-size:12px;line-height:18px;color:#ffffff;">Curve &amp; Comfort &middot; Furniture made for comfortable living</td></tr></table></div>`;
}

function verificationEmailTemplate({ verificationLink, expiresMinutes }) {
  return brandedEmailTemplate({ eyebrow: "Welcome to Curve & Comfort", title: "Verify your email", message: "Thank you for creating an account. Please confirm your email address to start shopping with us.", action: { href: verificationLink, label: "Verify Email Address" }, detail: `For your security, this link expires in ${expiresMinutes} minutes.`, notice: "If you did not create a Curve & Comfort account, you can safely ignore this email." });
}

function passwordResetEmailTemplate({ resetLink, expiresMinutes }) {
  return brandedEmailTemplate({ eyebrow: "Account security", title: "Reset your password", message: "We received a request to reset the password for your Curve & Comfort account.", action: { href: resetLink, label: "Reset Password" }, detail: `For your security, this link expires in ${expiresMinutes} minutes.`, notice: "If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged." });
}

function passwordChangedEmailTemplate() {
  return brandedEmailTemplate({ eyebrow: "Account security", title: "Your password was changed", message: "The password for your Curve & Comfort account was changed successfully.", detail: "You have been signed out of other devices to keep your account secure.", notice: "If you did not make this change, reset your password immediately and contact our support team." });
}

const money = (paise) => `₹${(Number(paise || 0) / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function paymentFailedEmailTemplate({ order, attempt, orderUrl }) {
  const reservationEnded = order.status === "cancelled";
  const content = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 28px;border:1px solid #e8e5df;border-collapse:collapse;"><tr><td style="padding:14px 16px;background:#f5f5f3;font-size:14px;line-height:22px;color:#55504a;">Order <strong style="color:#181818;">#${escapeHtml(order.orderNumber)}</strong><br />Payment amount: <strong style="color:#181818;">${money(attempt.amountPaise)}</strong></td></tr></table>`;
  return brandedEmailTemplate({
    eyebrow: "Payment update",
    title: reservationEnded ? "Your checkout was not completed" : "Your order is waiting for payment",
    message: reservationEnded ? "We could not confirm payment before your checkout reservation ended." : "We could not confirm this payment. Your order is pending and has not been confirmed.",
    content,
    action: !reservationEnded && orderUrl ? { href: orderUrl, label: "Complete pending order" } : null,
    detail: reservationEnded ? "The reservation has ended. Add the items again to start a new checkout." : "Your cart is empty because these items are stored in this pending order. You can safely try payment again while the reservation is active.",
    notice: "If money was deducted but your order is not confirmed, do not pay again. Contact our support team so we can verify the payment.",
  });
}

function checkoutExpiredEmailTemplate({ order }) {
  return brandedEmailTemplate({
    eyebrow: "Checkout update",
    title: "Your reservation has ended",
    message: `We could not confirm payment for order #${order.orderNumber} before its reservation ended.`,
    detail: "The reserved items were released. Add them to your cart again to start a new checkout.",
    notice: "If money was deducted, do not pay again. Contact our support team so we can verify the payment.",
  });
}

function itemImage(image, title, showColumn) {
  if (!showColumn) return "";
  if (!/^https?:\/\//i.test(String(image || ""))) return '<td width="72" style="padding:16px 0 16px 16px;vertical-align:top;">&nbsp;</td>';
  return `<td width="72" style="padding:16px 0 16px 16px;vertical-align:top;"><img src="${escapeHtml(image)}" alt="${escapeHtml(title)}" width="56" height="56" style="display:block;width:56px;height:56px;object-fit:cover;border:1px solid #e8e5df;" /></td>`;
}

function orderConfirmedEmailTemplate({ order, orderUrl, reserved = false, payment, supportEmail }) {
  const pricing = order.pricing || {};
  const address = order.addressSnapshot || {};
  const showImageColumn = (order.items || []).some((item) => /^https?:\/\//i.test(String(item.image || "")));
  const items = (order.items || []).map((item) => {
    const options = (item.selectedOptions || []).map((option) => `${escapeHtml(option.label || option.key)}: ${escapeHtml(option.value)}`).join(" &middot; ");
    const lineTotal = item.unitPricePaise * item.quantity;
    return `<tr>${itemImage(item.image, item.title, showImageColumn)}<td style="padding:16px;vertical-align:top;border-bottom:1px solid #e8e5df;"><p style="margin:0 0 6px;font-size:15px;font-weight:700;line-height:21px;color:#181818;">${escapeHtml(item.title)}</p>${options ? `<p style="margin:0;font-size:13px;line-height:19px;color:#817b74;">${options}</p>` : ""}</td><td align="right" style="padding:16px 8px;vertical-align:top;border-bottom:1px solid #e8e5df;font-size:14px;color:#55504a;white-space:nowrap;">${money(item.unitPricePaise)}</td><td align="center" style="padding:16px 8px;vertical-align:top;border-bottom:1px solid #e8e5df;font-size:14px;color:#55504a;">${Number(item.quantity || 0)}</td><td align="right" style="padding:16px;vertical-align:top;border-bottom:1px solid #e8e5df;font-size:14px;font-weight:700;color:#181818;white-space:nowrap;">${money(lineTotal)}</td></tr>`;
  }).join("");
  const addressLines = [address.line1, address.line2, address.landmark, [address.city, address.state, address.postalCode].filter(Boolean).join(", "), address.country, address.phone && `Phone: ${address.phone}`].filter(Boolean).map((line) => `<p style="margin:0 0 5px;font-size:14px;line-height:20px;color:#55504a;">${escapeHtml(line)}</p>`).join("");
  const discount = Number(pricing.discountPaise || 0);
  const shipping = Number(pricing.shippingPaise || 0);
  const tax = Number(pricing.taxPaise || 0);
  const paidToday = Number(reserved ? pricing.advancePaise || pricing.totalPaise || 0 : order.advancePaidPaise || pricing.advancePaise || pricing.totalPaise || 0);
  const balance = Number(order.codBalanceDuePaise ?? pricing.balanceDuePaise ?? 0);
  const orderDate = order.createdAt ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.createdAt)) : "";
  const paymentMethod = ({ upi: "UPI", card: "Card", cod: "Cash on delivery" })[order.paymentMethod] || "Not specified";
  const transactionReference = payment?.cfPaymentId ? `Cashfree ••••${String(payment.cfPaymentId).slice(-4)}` : "No payment required";
  const advanceLabel = reserved ? "Payment due today" : order.paymentMethod === "cod" ? "COD advance paid" : "Total paid";
  const balanceLabel = order.codBalanceStatus === "collected" ? "COD balance collected" : "COD balance due on delivery";
  const content = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 28px;border:1px solid #e8e5df;border-collapse:collapse;"><tr><td style="padding:14px 16px;background:#f5f5f3;font-size:13px;line-height:19px;color:#55504a;"><strong style="color:#181818;">Order #${escapeHtml(order.orderNumber)}</strong>${orderDate ? ` &middot; Placed ${escapeHtml(orderDate)}` : ""}<br />Customer: ${escapeHtml(address.fullName)}</td></tr></table><h2 style="margin:0 0 12px;font-size:19px;line-height:25px;color:#181818;">Items in your order</h2><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 28px;border:1px solid #e8e5df;border-collapse:collapse;"><tr style="background:#f5f5f3;"><th align="left" colspan="${showImageColumn ? 2 : 1}" style="padding:12px 16px;font-size:12px;letter-spacing:.5px;text-transform:uppercase;color:#55504a;">Product</th><th align="right" style="padding:12px 8px;font-size:12px;letter-spacing:.5px;text-transform:uppercase;color:#55504a;">Unit price</th><th style="padding:12px 8px;font-size:12px;letter-spacing:.5px;text-transform:uppercase;color:#55504a;">Qty</th><th align="right" style="padding:12px 16px;font-size:12px;letter-spacing:.5px;text-transform:uppercase;color:#55504a;">Total</th></tr>${items}</table><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 28px;"><tr><td width="52%" style="padding:0 20px 0 0;vertical-align:top;"><h2 style="margin:0 0 12px;font-size:19px;line-height:25px;color:#181818;">Delivery address</h2><p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#181818;">${escapeHtml(address.fullName)}</p>${addressLines}</td><td style="padding:0;vertical-align:top;"><h2 style="margin:0 0 12px;font-size:19px;line-height:25px;color:#181818;">Order summary</h2><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr><td style="padding:0 0 8px;font-size:14px;color:#55504a;">Subtotal</td><td align="right" style="padding:0 0 8px;font-size:14px;color:#181818;">${money(pricing.subtotalPaise)}</td></tr>${discount ? `<tr><td style="padding:0 0 8px;font-size:14px;color:#2f9e50;">Discount${order.couponCode ? ` (${escapeHtml(order.couponCode)})` : ""}</td><td align="right" style="padding:0 0 8px;font-size:14px;color:#2f9e50;">−${money(discount)}</td></tr>` : ""}<tr><td style="padding:0 0 8px;font-size:14px;color:#55504a;">GST</td><td align="right" style="padding:0 0 8px;font-size:14px;color:#181818;">${money(tax)}</td></tr><tr><td style="padding:0 0 12px;font-size:14px;color:#55504a;">Delivery</td><td align="right" style="padding:0 0 12px;font-size:14px;color:#181818;">${shipping ? money(shipping) : "Included"}</td></tr><tr><td style="padding:12px 0;border-top:1px solid #e8e5df;font-size:16px;font-weight:700;color:#181818;">Order total</td><td align="right" style="padding:12px 0;border-top:1px solid #e8e5df;font-size:16px;font-weight:700;color:#181818;">${money(pricing.totalPaise)}</td></tr><tr><td style="padding:0 0 8px;font-size:14px;color:#55504a;">${advanceLabel}</td><td align="right" style="padding:0 0 8px;font-size:14px;font-weight:700;color:#181818;">${money(paidToday)}</td></tr><tr><td style="padding:0 0 8px;font-size:14px;color:#55504a;">Payment method</td><td align="right" style="padding:0 0 8px;font-size:14px;color:#181818;">${escapeHtml(paymentMethod)}</td></tr><tr><td style="padding:0 0 8px;font-size:14px;color:#55504a;">Transaction reference</td><td align="right" style="padding:0 0 8px;font-size:14px;color:#181818;">${escapeHtml(transactionReference)}</td></tr>${balance ? `<tr><td style="padding:0;font-size:14px;color:#55504a;">${balanceLabel}</td><td align="right" style="padding:0;font-size:14px;color:#181818;">${money(balance)}</td></tr>` : ""}</table></td></tr></table>`;
  return brandedEmailTemplate({
    eyebrow: reserved ? "Order reserved" : "Order confirmation",
    title: reserved ? "Your items are reserved" : "Your order is confirmed",
    message: reserved ? `We reserved your order, ${address.fullName || "there"}. Complete payment before ${new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.expiresAt))} to confirm it.` : `Thank you for your purchase, ${address.fullName || "there"}. We are preparing your order now.`,
    content,
    action: orderUrl ? { href: orderUrl, label: reserved ? "Complete payment" : "View your order" } : null,
    detail: reserved ? "Your order is not confirmed until payment is completed. Your cart is empty because these items are held in this reservation." : "Estimated delivery is 3–7 business days after confirmation. We will email you again when your order is dispatched.",
    notice: reserved ? "If money was deducted but payment did not complete, do not pay again. Contact our support team so we can verify it." : `Need help with your order? Reply to this email${supportEmail ? ` or contact ${supportEmail}` : ""}.`,
  });
}

const orderReservedEmailTemplate = ({ order, orderUrl }) => orderConfirmedEmailTemplate({ order, orderUrl, reserved: true });

function refundEmailTemplate({ order, refund, title, message, notice, detail = "Keep this email for your records." }) {
  const content = `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 28px;border:1px solid #e8e5df;border-collapse:collapse;"><tr><td style="padding:14px 16px;background:#f5f5f3;font-size:14px;color:#55504a;">Order <strong style="color:#181818;">#${escapeHtml(order.orderNumber)}</strong></td></tr><tr><td style="padding:16px;font-size:14px;line-height:22px;color:#55504a;">Refund reference: <strong style="color:#181818;">${escapeHtml(refund.refundId)}</strong><br />Refund amount: <strong style="color:#181818;">${money(refund.amountPaise)}</strong>${refund.reason ? `<br />Reason: ${escapeHtml(refund.reason)}` : ""}</td></tr></table>`;
  return brandedEmailTemplate({ eyebrow: "Refund update", title, message, content, detail, notice });
}

const refundInitiatedEmailTemplate = ({ order, refund }) => refundEmailTemplate({ order, refund, title: "Your refund is being processed", message: "We have sent your refund request to our payment partner.", notice: "Refund processing times depend on your bank and payment method." });
const refundCompletedEmailTemplate = ({ order, refund }) => refundEmailTemplate({ order, refund, title: "Your refund has been completed", message: "Your refund has been processed successfully.", notice: "Your bank may take a few business days to show the credit in your account." });
const refundFailedEmailTemplate = ({ order, refund }) => refundEmailTemplate({ order, refund, title: "Your refund needs attention", message: "We could not complete your refund automatically. Our support team will review it.", notice: "Please do not submit another refund request for this order." });
const duplicatePaymentResolvedSupportEmailTemplate = ({ order, refund }) => refundEmailTemplate({ order, refund, title: "Duplicate payment refunded", message: "A duplicate payment was automatically refunded. Review the order if the payment provider reports a discrepancy.", detail: "No customer action is required.", notice: "This is an internal support alert." });

module.exports = { verificationEmailTemplate, passwordResetEmailTemplate, passwordChangedEmailTemplate, orderReservedEmailTemplate, paymentFailedEmailTemplate, checkoutExpiredEmailTemplate, orderConfirmedEmailTemplate, refundInitiatedEmailTemplate, refundCompletedEmailTemplate, refundFailedEmailTemplate, duplicatePaymentResolvedSupportEmailTemplate };
