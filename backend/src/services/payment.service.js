const crypto = require("crypto");
const { env } = require("../config/env");
const ApiError = require("../utils/ApiError");

const baseUrl = () => env.cashfreeEnvironment === "production" ? "https://api.cashfree.com" : "https://sandbox.cashfree.com";

function requireCashfree() {
  if (!env.cashfreeClientId || !env.cashfreeClientSecret) throw new ApiError(503, "Payments are not configured");
}

async function createCashfreeOrder({ orderNumber, amountPaise, user, idempotencyKey }) {
  requireCashfree();
  const response = await globalThis.fetch(`${baseUrl()}/pg/orders`, {
    method: "POST",
    headers: {
      "content-type": "application/json", "x-api-version": env.cashfreeApiVersion,
      "x-client-id": env.cashfreeClientId, "x-client-secret": env.cashfreeClientSecret,
      "x-idempotency-key": idempotencyKey || crypto.randomUUID(),
    },
    body: JSON.stringify({
      order_id: orderNumber,
      order_amount: Number((amountPaise / 100).toFixed(2)),
      order_currency: "INR",
      customer_details: { customer_id: user.id, customer_name: user.fullName, customer_email: user.email, customer_phone: user.mobileNumber },
      order_meta: { return_url: `${env.frontendUrl}/checkout/confirmation?order_id={order_id}` },
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.payment_session_id) throw new ApiError(502, body.message || "Unable to start payment");
  return body;
}

function verifyCashfreeWebhook({ signature, timestamp, rawBody }) {
  if (!signature || !timestamp || !env.cashfreeClientSecret) return false;
  const expected = crypto.createHmac("sha256", env.cashfreeClientSecret).update(`${timestamp}${rawBody}`).digest("base64");
  const received = Buffer.from(signature);
  const generated = Buffer.from(expected);
  return received.length === generated.length && crypto.timingSafeEqual(received, generated);
}

module.exports = { createCashfreeOrder, verifyCashfreeWebhook };
