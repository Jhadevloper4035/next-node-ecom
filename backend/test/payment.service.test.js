process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret";
process.env.CASHFREE_CLIENT_ID ||= "webhook-test-client";
process.env.CASHFREE_CLIENT_SECRET = "webhook-test-secret";
process.env.CASHFREE_WEBHOOK_URL ||= "https://payments.example.com/api/v1/payments/cashfree/webhook";

const crypto = require("crypto");
const assert = require("node:assert/strict");
const test = require("node:test");
const { createCashfreeOrder, createCashfreeRefund, getCashfreeOrder, getCashfreePayments, getCashfreeRefunds, verifyCashfreeWebhook, validWebhookTimestamp, isCashfreeUserDropped } = require("../src/services/payment.service");

test("Cashfree webhook verification requires the signed raw payload", () => {
  const rawBody = '{"type":"PAYMENT_SUCCESS_WEBHOOK"}';
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = crypto.createHmac("sha256", process.env.CASHFREE_CLIENT_SECRET).update(`${timestamp}${rawBody}`).digest("base64");
  assert.equal(verifyCashfreeWebhook({ signature, timestamp, rawBody }), true);
  assert.equal(verifyCashfreeWebhook({ signature, timestamp, rawBody: "{}" }), false);
});

test("Cashfree webhook verification rejects stale timestamps", () => {
  assert.equal(validWebhookTimestamp(String(Math.floor(Date.now() / 1000) - 301)), false);
  assert.equal(validWebhookTimestamp(String(Math.floor(Date.now() / 1000))), true);
});

test("Cashfree USER_DROPPED is kept separate from a failed payment", () => {
  assert.equal(isCashfreeUserDropped({ data: { payment: { payment_status: "USER_DROPPED" } } }), true);
  assert.equal(isCashfreeUserDropped({ data: { payment: { payment_status: "FAILED" } } }), false);
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

test("Cashfree payment attempts are checked on the server", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    assert.match(url, /\/pg\/orders\/CC123\/payments$/);
    return { ok: true, json: async () => ([{ cf_payment_id: "payment-123", payment_status: "SUCCESS" }]) };
  };
  try {
    assert.equal((await getCashfreePayments("CC123"))[0].cf_payment_id, "payment-123");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Cashfree refunds use the merchant refund ID and can be reconciled", async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (url, options = {}) => {
    requests.push({ url, options });
    return { ok: true, json: async () => options.method === "POST" ? ({ refund_id: "RF1", refund_status: "PENDING", cf_refund_id: "CF1" }) : ([{ refund_id: "RF1", refund_status: "SUCCESS", cf_refund_id: "CF1" }]) };
  };
  try {
    await createCashfreeRefund({ orderNumber: "CC123", refundId: "RF1", amountPaise: 10_000, reason: "Duplicate charge" });
    assert.deepEqual(JSON.parse(requests[0].options.body), { refund_amount: 100, refund_id: "RF1", refund_note: "Duplicate charge", refund_speed: "STANDARD" });
    assert.equal((await getCashfreeRefunds("CC123"))[0].refund_status, "SUCCESS");
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

test("Cashfree order creation fails safely on gateway errors and timeouts", async () => {
  const originalFetch = globalThis.fetch;
  const request = { orderNumber: "CC123", amountPaise: 10_000, user: { id: "user", fullName: "Test User", email: "test@example.com", mobileNumber: "9999999999" }, paymentMethods: "upi", expiresAt: new Date("2026-08-20T06:30:00.000Z") };
  try {
    globalThis.fetch = async () => ({ ok: false, json: async () => ({ message: "Gateway unavailable" }) });
    await assert.rejects(createCashfreeOrder(request), (error) => error.statusCode === 502 && error.message === "Gateway unavailable");

    globalThis.fetch = async () => { throw new Error("request timed out"); };
    await assert.rejects(createCashfreeOrder(request), (error) => error.statusCode === 502 && error.message === "Unable to start payment");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
