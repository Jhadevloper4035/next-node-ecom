const assert = require("node:assert/strict");
const test = require("node:test");
const { verificationEmailTemplate, passwordResetEmailTemplate, passwordChangedEmailTemplate, orderReservedEmailTemplate, paymentFailedEmailTemplate, checkoutExpiredEmailTemplate, orderConfirmedEmailTemplate, refundCompletedEmailTemplate } = require("../src/utils/emailTemplates");

test("auth emails share Curve & Comfort branding and safely render links", () => {
  const emails = [verificationEmailTemplate({ verificationLink: 'https://example.com/?q="<script>', expiresMinutes: 30 }), passwordResetEmailTemplate({ resetLink: "https://example.com/reset", expiresMinutes: 15 }), passwordChangedEmailTemplate()];
  for (const html of emails) assert.match(html, /Curve &amp; Comfort/);
  for (const html of emails) assert.match(html, /src="http:\/\/localhost:3000\/images\/logo\/logo\.png"/);
  assert.match(emails[0], /&quot;&lt;script&gt;/);
  assert.match(emails[1], /Reset Password/);
});

test("order confirmation uses the shared brand and complete order snapshot", () => {
  const html = orderConfirmedEmailTemplate({
    orderUrl: "https://example.com/my-account-orders-details?order_id=CC1",
    payment: { cfPaymentId: "cashfree-payment-1234" },
    supportEmail: "support@example.com",
    order: {
      orderNumber: "CC1",
      couponCode: "WELCOME10",
      createdAt: "2026-08-20T12:00:00.000Z",
      items: [{ title: 'Bed <script>', image: "https://example.com/bed.jpg", quantity: 2, unitPricePaise: 10_000, selectedOptions: [{ label: "Colour", value: "Copper" }] }],
      pricing: { subtotalPaise: 20_000, discountPaise: 2_000, shippingPaise: 0, taxPaise: 3_240, totalPaise: 21_240, advancePaise: 21_240, balanceDuePaise: 0 },
      addressSnapshot: { fullName: "Customer", line1: "1 Main Street", city: "Noida", state: "Uttar Pradesh", postalCode: "201301", country: "India", phone: "9999999999" },
    },
  });

  assert.match(html, /Curve &amp; Comfort/);
  assert.match(html, /Items in your order/);
  assert.match(html, /Order summary/);
  assert.match(html, /WELCOME10/);
  assert.match(html, /GST/);
  assert.match(html, /Customer: Customer/);
  assert.match(html, /Unit price/);
  assert.match(html, /Payment method/);
  assert.match(html, /Cashfree ••••1234/);
  assert.match(html, /Estimated delivery is 3–7 business days/);
  assert.match(html, /support@example.com/);
  assert.match(html, /&lt;script&gt;/);
  assert.match(html, /View your order/);
});

test("COD order confirmation distinguishes the paid advance from the delivery balance", () => {
  const html = orderConfirmedEmailTemplate({
    order: { orderNumber: "CC1", paymentMethod: "cod", advancePaidPaise: 6_000, codBalanceDuePaise: 12_000, pricing: { totalPaise: 18_000 }, items: [], addressSnapshot: {} },
  });
  assert.match(html, /COD advance paid/);
  assert.match(html, /COD balance due on delivery/);
  assert.match(html, /₹120\.00/);
});

test("reserved order email includes the payment deadline and complete order details", () => {
  const html = orderReservedEmailTemplate({
    orderUrl: "https://example.com/my-account-orders-details?order_id=CC1",
    order: { orderNumber: "CC1", expiresAt: "2026-08-22T12:00:00.000Z", items: [{ title: "Bed", quantity: 1, unitPricePaise: 10_000 }], pricing: { subtotalPaise: 10_000, totalPaise: 10_000, advancePaise: 10_000 }, addressSnapshot: { fullName: "Customer", line1: "1 Main Street", city: "Noida", state: "Uttar Pradesh", postalCode: "201301" } },
  });

  assert.match(html, /Your items are reserved/);
  assert.match(html, /Bed/);
  assert.match(html, /Delivery address/);
  assert.match(html, /Payment due today/);
  assert.match(html, /Complete payment/);
});

test("payment failure email keeps the shared branding and links to the pending order", () => {
  const html = paymentFailedEmailTemplate({ order: { orderNumber: "CC1" }, attempt: { amountPaise: 10_000 }, orderUrl: "https://example.com/my-account-orders-details?order_id=CC1" });
  assert.match(html, /#CC1/);
  assert.match(html, /₹100\.00/);
  assert.match(html, /Curve &amp; Comfort/);
  assert.match(html, /Complete pending order/);
  assert.match(html, /my-account-orders-details\?order_id=CC1/);
  assert.match(html, /cart is empty/i);
  assert.match(html, /money was deducted/i);
  assert.doesNotMatch(html, /rawWebhookPayload|Cashfree error/i);
});

test("expired checkout emails explain that a fresh checkout is required", () => {
  const html = paymentFailedEmailTemplate({ order: { orderNumber: "CC1", status: "cancelled" }, attempt: { amountPaise: 10_000 }, orderUrl: "https://example.com/my-account-orders-details?order_id=CC1" });
  assert.match(html, /checkout was not completed/);
  assert.match(html, /start a new checkout/i);
});

test("reservation expiry email never asks the customer to pay again", () => {
  const html = checkoutExpiredEmailTemplate({ order: { orderNumber: "CC1" } });
  assert.match(html, /reservation has ended/i);
  assert.match(html, /do not pay again/i);
  assert.doesNotMatch(html, /Complete pending order/);
});

test("refund emails use the same branded layout", () => {
  const html = refundCompletedEmailTemplate({ order: { orderNumber: "CC1" }, refund: { refundId: "RF1", amountPaise: 10_000, reason: "Duplicate charge" } });
  assert.match(html, /Curve &amp; Comfort/);
  assert.match(html, /Your refund has been completed/);
  assert.match(html, /RF1/);
});
