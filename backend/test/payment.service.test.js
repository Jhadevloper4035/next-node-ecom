process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret";
process.env.CASHFREE_CLIENT_ID ||= "webhook-test-client";
process.env.CASHFREE_CLIENT_SECRET = "webhook-test-secret";
process.env.CASHFREE_WEBHOOK_URL ||= "https://payments.example.com/api/v1/payments/cashfree/webhook";

const crypto = require("crypto");
const assert = require("node:assert/strict");
const test = require("node:test");
const { createCashfreeOrder, getCashfreeOrder, verifyCashfreeWebhook } = require("../src/services/payment.service");

test("Cashfree webhook verification requires the signed raw payload", () => {
  const rawBody = '{"type":"PAYMENT_SUCCESS_WEBHOOK"}';
  const timestamp = "1720000000";
  const signature = crypto.createHmac("sha256", process.env.CASHFREE_CLIENT_SECRET).update(`${timestamp}${rawBody}`).digest("base64");
  assert.equal(verifyCashfreeWebhook({ signature, timestamp, rawBody }), true);
  assert.equal(verifyCashfreeWebhook({ signature, timestamp, rawBody: "{}" }), false);
});

test("Cashfree order status is checked on the server", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.match(url, /\/pg\/orders\/CC123$/);
    assert.equal(options.headers["x-client-id"], process.env.CASHFREE_CLIENT_ID);
    return { ok: true, json: async () => ({ order_id: "CC123", order_status: "PAID", order_amount: 100 }) };
  };
  try {
    assert.equal((await getCashfreeOrder("CC123")).order_status, "PAID");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Cashfree order uses the checkout expiry and webhook URL", async () => {
  const originalFetch = globalThis.fetch;
  const expiresAt = new Date("2026-08-20T06:30:00.000Z");
  let request;
  globalThis.fetch = async (_url, options) => {
    request = options;
    return { ok: true, json: async () => ({ cf_order_id: "1", payment_session_id: "session" }) };
  };

  try {
    await createCashfreeOrder({ orderNumber: "CC123", amountPaise: 10_000, user: { id: "user", fullName: "Test User", email: "test@example.com", mobileNumber: "9999999999" }, idempotencyKey: crypto.randomUUID(), paymentMethods: "upi", expiresAt });
    const body = JSON.parse(request.body);
    assert.equal(body.order_expiry_time, expiresAt.toISOString());
    assert.equal(body.order_meta.notify_url, process.env.CASHFREE_WEBHOOK_URL);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
