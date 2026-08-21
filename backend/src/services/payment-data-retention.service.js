const { env } = require("../config/env");
const PaymentWebhookEvent = require("../models/paymentWebhookEvent.model");
const PaymentTransaction = require("../models/paymentTransaction.model");
const Refund = require("../models/refund.model");

async function redactExpiredPaymentPayloads(now = new Date()) {
  const cutoff = new Date(now.getTime() - env.paymentPayloadRetentionDays * 24 * 60 * 60 * 1000);
  const [webhooks, transactions, refunds] = await Promise.all([
    PaymentWebhookEvent.updateMany({ receivedAt: { $lte: cutoff }, rawPayload: { $ne: "" } }, { $set: { rawPayload: "" } }),
    PaymentTransaction.updateMany({ updatedAt: { $lte: cutoff }, rawWebhookPayload: { $ne: "" } }, { $set: { rawWebhookPayload: "" } }),
    Refund.updateMany({ updatedAt: { $lte: cutoff }, rawResponse: { $ne: "" } }, { $set: { rawResponse: "" } }),
  ]);
  return webhooks.modifiedCount + transactions.modifiedCount + refunds.modifiedCount;
}

module.exports = { redactExpiredPaymentPayloads };
