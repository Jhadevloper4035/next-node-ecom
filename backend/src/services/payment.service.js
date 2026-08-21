const crypto = require("crypto");
const { env } = require("../config/env");
const ApiError = require("../utils/ApiError");
const PaymentGatewayCall = require("../models/paymentGatewayCall.model");

const baseUrl = () => env.cashfreeEnvironment === "production" ? "https://api.cashfree.com" : "https://sandbox.cashfree.com";

function requireCashfree() {
  if (!env.cashfreeClientId || !env.cashfreeClientSecret) throw new ApiError(503, "Payments are not configured");
}

function recordCashfreeCall(data) {
  if (PaymentGatewayCall.db.readyState !== 1) return;
  try {
    PaymentGatewayCall.create(data).catch((error) => console.error("Cashfree monitoring write failed:", error.message));
  } catch (error) {
    console.error("Cashfree monitoring write failed:", error.message);
  }
}

async function cashfreeFetch(operation, url, options) {
  const startedAt = Date.now();
  try {
    const response = await globalThis.fetch(url, options);
    recordCashfreeCall({ operation, success: response.ok, statusCode: response.status || 0, durationMs: Date.now() - startedAt });
    return response;
  } catch (error) {
    recordCashfreeCall({ operation, success: false, durationMs: Date.now() - startedAt, error: error.message });
    throw error;
  }
}

async function createCashfreeOrder({ orderNumber, amountPaise, user, idempotencyKey, paymentMethods, expiresAt }) {
  requireCashfree();
  let response;
  try {
    response = await cashfreeFetch("create_order", `${baseUrl()}/pg/orders`, {
      method: "POST",
      headers: {
        "content-type": "application/json", "x-api-version": env.cashfreeApiVersion,
        "x-client-id": env.cashfreeClientId, "x-client-secret": env.cashfreeClientSecret,
        "x-idempotency-key": idempotencyKey || crypto.randomUUID(),
      },
      ...(globalThis.AbortSignal?.timeout && { signal: globalThis.AbortSignal.timeout(15_000) }),
      body: JSON.stringify({
        order_id: orderNumber,
        order_amount: Number((amountPaise / 100).toFixed(2)),
        order_currency: "INR",
        customer_details: { customer_id: user.id, customer_name: user.fullName, customer_email: user.email, customer_phone: user.mobileNumber },
        order_expiry_time: expiresAt.toISOString(),
        order_meta: {
          return_url: `${env.frontendUrl}/checkout/confirmation?order_id={order_id}`,
          payment_methods: paymentMethods,
          ...(env.cashfreeWebhookUrl && { notify_url: env.cashfreeWebhookUrl }),
        },
      }),
    });
  } catch {
    throw new ApiError(502, "Unable to start payment");
  }
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.payment_session_id) throw new ApiError(502, body.message || "Unable to start payment");
  return body;
}

async function getCashfreeOrder(orderNumber) {
  requireCashfree();
  const response = await cashfreeFetch("get_order", `${baseUrl()}/pg/orders/${encodeURIComponent(orderNumber)}`, {
    headers: {
      "x-api-version": env.cashfreeApiVersion,
      "x-client-id": env.cashfreeClientId,
      "x-client-secret": env.cashfreeClientSecret,
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(502, body.message || "Unable to check payment status");
  return body;
}

async function getCashfreePayments(orderNumber) {
  requireCashfree();
  const response = await cashfreeFetch("get_payments", `${baseUrl()}/pg/orders/${encodeURIComponent(orderNumber)}/payments`, {
    headers: {
      "x-api-version": env.cashfreeApiVersion,
      "x-client-id": env.cashfreeClientId,
      "x-client-secret": env.cashfreeClientSecret,
    },
  });
  const body = await response.json().catch(() => []);
  if (!response.ok || !Array.isArray(body)) throw new ApiError(502, body.message || "Unable to check payment attempts");
  return body;
}

async function createCashfreeRefund({ orderNumber, refundId, amountPaise, reason }) {
  requireCashfree();
  const response = await cashfreeFetch("create_refund", `${baseUrl()}/pg/orders/${encodeURIComponent(orderNumber)}/refunds`, {
    method: "POST",
    headers: {
      "content-type": "application/json", "x-api-version": env.cashfreeApiVersion,
      "x-client-id": env.cashfreeClientId, "x-client-secret": env.cashfreeClientSecret,
      "x-idempotency-key": refundId,
    },
    ...(globalThis.AbortSignal?.timeout && { signal: globalThis.AbortSignal.timeout(15_000) }),
    body: JSON.stringify({ refund_amount: Number((amountPaise / 100).toFixed(2)), refund_id: refundId, refund_note: reason, refund_speed: "STANDARD" }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(502, body.message || "Unable to start refund");
  return body;
}

async function getCashfreeRefunds(orderNumber) {
  requireCashfree();
  const response = await cashfreeFetch("get_refunds", `${baseUrl()}/pg/orders/${encodeURIComponent(orderNumber)}/refunds`, {
    headers: {
      "x-api-version": env.cashfreeApiVersion,
      "x-client-id": env.cashfreeClientId,
      "x-client-secret": env.cashfreeClientSecret,
    },
  });
  const body = await response.json().catch(() => []);
  if (!response.ok || !Array.isArray(body)) throw new ApiError(502, body.message || "Unable to check refunds");
  return body;
}

function validWebhookTimestamp(timestamp, now = Date.now()) {
  if (!/^\d{10,13}$/.test(String(timestamp))) return false;
  const value = Number(timestamp);
  const timestampMs = String(timestamp).length === 10 ? value * 1000 : value;
  return Number.isSafeInteger(timestampMs)
    && Math.abs(now - timestampMs) <= env.cashfreeWebhookToleranceSeconds * 1000;
}

function verifyCashfreeWebhook({ signature, timestamp, rawBody }) {
  if (!signature || !timestamp || !env.cashfreeClientSecret || !validWebhookTimestamp(timestamp)) return false;
  const expected = crypto.createHmac("sha256", env.cashfreeClientSecret).update(`${timestamp}${rawBody}`).digest("base64");
  const received = Buffer.from(signature);
  const generated = Buffer.from(expected);
  return received.length === generated.length && crypto.timingSafeEqual(received, generated);
}

function isCashfreeUserDropped(payload) {
  const payment = payload?.data?.payment || payload?.payment || {};
  return payment.payment_status === "USER_DROPPED";
}

module.exports = { createCashfreeOrder, createCashfreeRefund, getCashfreeOrder, getCashfreePayments, getCashfreeRefunds, verifyCashfreeWebhook, validWebhookTimestamp, isCashfreeUserDropped };
