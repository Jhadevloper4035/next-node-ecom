const crypto = require("crypto");
const ApiResponse = require("../utils/ApiResponse");
const Order = require("../models/order.model");
const PaymentTransaction = require("../models/paymentTransaction.model");
const PaymentWebhookEvent = require("../models/paymentWebhookEvent.model");
const Refund = require("../models/refund.model");
const { paymentAttemptForGateway } = require("../services/checkout.service");
const { verifyCashfreeWebhook } = require("../services/payment.service");
const { applyCashfreePaymentState, isUnconfirmedPaymentState, recordFailedPaymentEmail, resolveSuccessfulPayment, paymentState } = require("../services/payment-state.service");
const { applyCashfreeRefund, recordDuplicatePaymentAutoRefund } = require("../services/refund.service");
const { paymentVerificationError } = require("../services/payment-verification.service");
const { redactPaymentPayload } = require("../utils/paymentPayload");
const { releaseCouponReservation } = require("../services/coupon-lifecycle.service");

const paymentData = (payload) => payload?.data?.payment || payload?.payment || {};
const orderData = (payload) => payload?.data?.order || payload?.order || {};
const refundData = (payload) => payload?.data?.refund || payload?.refund || payload?.data?.auto_refund || {};
const dedupeKey = (req, rawBody) => req.get("x-idempotency-key") || crypto.createHash("sha256").update(rawBody).digest("hex");

async function markEvent(event, status, processingError = "") {
  event.status = status;
  event.processingError = processingError;
  event.processedAt = new Date();
  await event.save();
}

async function claimWebhookEvent(data) {
  try {
    return await PaymentWebhookEvent.create({ ...data, status: "processing" });
  } catch (error) {
    if (error?.code !== 11000) throw error;
  }

  const existing = await PaymentWebhookEvent.findOne({ gateway: data.gateway, dedupeKey: data.dedupeKey });
  if (!existing) return null;
  if (["processed", "ignored"].includes(existing.status)) {
    await PaymentWebhookEvent.updateOne({ _id: existing._id }, { $inc: { duplicateCount: 1 } });
    return null;
  }
  const staleAt = new Date(Date.now() - 5 * 60_000);
  return PaymentWebhookEvent.findOneAndUpdate(
    { _id: existing._id, $or: [{ status: "failed" }, { status: "processing", processingStartedAt: { $lte: staleAt } }] },
    { $set: { status: "processing", processingStartedAt: new Date(), processingError: "" } },
    { new: true },
  );
}

exports.cashfreeWebhook = async (req, res) => {
  const rawBody = req.body?.toString("utf8") || "";
  const safeRawPayload = redactPaymentPayload(rawBody);
  let payload;
  try { payload = JSON.parse(rawBody); } catch {
    await PaymentWebhookEvent.create({
      gateway: "cashfree",
      dedupeKey: dedupeKey(req, rawBody),
      signatureValid: verifyCashfreeWebhook({ signature: req.get("x-webhook-signature"), timestamp: req.get("x-webhook-timestamp"), rawBody }),
      rawPayload: safeRawPayload,
      status: "ignored",
      processingError: "Invalid webhook payload",
      processedAt: new Date(),
    }).catch(() => {});
    return res.status(400).json({ success: false, message: "Invalid webhook payload" });
  }

  const payment = paymentData(payload);
  const refund = refundData(payload);
  const merchantOrderId = String(orderData(payload).order_id || refund.order_id || "");
  const cashfreeOrderId = String(orderData(payload).cf_order_id || payment.cf_order_id || "");
  const event = {
    gateway: "cashfree",
    dedupeKey: dedupeKey(req, rawBody),
    eventType: payload.type || "UNKNOWN",
    cfPaymentId: String(payment.cf_payment_id || refund.cf_payment_id || ""),
    orderId: merchantOrderId,
    cfOrderId: cashfreeOrderId,
    signatureValid: verifyCashfreeWebhook({ signature: req.get("x-webhook-signature"), timestamp: req.get("x-webhook-timestamp"), rawBody }),
    rawPayload: safeRawPayload,
  };
  if (!event.signatureValid) {
    await PaymentWebhookEvent.create({ ...event, status: "ignored", processingError: "Invalid webhook signature", processedAt: new Date() }).catch(() => {});
    return res.status(400).json({ success: false, message: "Invalid webhook signature" });
  }

  const claimedEvent = await claimWebhookEvent(event);
  if (!claimedEvent) return res.status(200).json(new ApiResponse({ message: "Webhook already processed" }));

  try {
    if (claimedEvent.eventType.includes("REFUND")) {
      const localRefund = await Refund.findOne({ $or: [{ refundId: String(refund.refund_id || "") }, { cfRefundId: String(refund.cf_refund_id || "") }] });
      if (!localRefund) {
        const autoRefund = await recordDuplicatePaymentAutoRefund({ orderNumber: merchantOrderId, refund, audit: { actorType: "cashfree_webhook", correlationId: claimedEvent.dedupeKey, paymentId: event.cfPaymentId } });
        if (autoRefund) {
          await markEvent(claimedEvent, "processed");
          return res.status(200).json(new ApiResponse({ message: "Duplicate payment refund processed" }));
        }
        await markEvent(claimedEvent, "ignored", "Refund not found");
        return res.status(200).json(new ApiResponse({ message: "Webhook ignored" }));
      }
      await applyCashfreeRefund(localRefund, refund, { actorType: "cashfree_webhook", correlationId: claimedEvent.dedupeKey });
      await markEvent(claimedEvent, "processed");
      return res.status(200).json(new ApiResponse({ message: "Refund webhook processed" }));
    }

    const order = await Order.findOne({ orderNumber: merchantOrderId });
    if (!order) {
      await markEvent(claimedEvent, "ignored", "Order not found");
      return res.status(200).json(new ApiResponse({ message: "Webhook ignored" }));
    }
    const activeTransactionId = order.activePaymentTransaction || order.paymentTransaction;
    const activeTransaction = activeTransactionId && await PaymentTransaction.findById(activeTransactionId);
    if (!activeTransaction) {
      await markEvent(claimedEvent, "ignored", "Payment attempt not found");
      return res.status(200).json(new ApiResponse({ message: "Webhook ignored" }));
    }
    const verificationError = paymentVerificationError({ order, attempt: activeTransaction, payment, merchantOrderId, cashfreeOrderId });
    if (verificationError) {
      await markEvent(claimedEvent, "ignored", verificationError);
      return res.status(400).json({ success: false, message: verificationError });
    }
    const transaction = await paymentAttemptForGateway({ order, activeTransaction, paymentId: event.cfPaymentId, actorType: "cashfree_webhook", correlationId: claimedEvent.dedupeKey });
    if (!transaction) {
      await markEvent(claimedEvent, "ignored", "Payment attempt not found");
      return res.status(200).json(new ApiResponse({ message: "Webhook ignored" }));
    }

    const state = paymentState(payment.payment_status);
    if (state === "paid") {
      const result = await resolveSuccessfulPayment({ order, attempt: transaction, paymentId: event.cfPaymentId, rawPayload: safeRawPayload, actorType: "cashfree_webhook", correlationId: claimedEvent.dedupeKey });
      await markEvent(claimedEvent, "processed", result.outcome === "confirmed" ? "" : result.outcome);
      return res.status(200).json(new ApiResponse({ message: result.outcome === "confirmed" ? "Webhook processed" : "Payment sent for review" }));
    }

    const result = await applyCashfreePaymentState({ attempt: transaction, cashfreeStatus: payment.payment_status, paymentId: event.cfPaymentId, rawPayload: safeRawPayload, actorType: "cashfree_webhook", correlationId: claimedEvent.dedupeKey });
    if (["failed", "cancelled"].includes(result.state)) await releaseCouponReservation(order);
    if (isUnconfirmedPaymentState(result.state)) await recordFailedPaymentEmail({ order, attempt: transaction });
    await markEvent(claimedEvent, "processed");
    return res.status(200).json(new ApiResponse({ message: "Webhook processed" }));
  } catch (error) {
    await markEvent(claimedEvent, "failed", error.message).catch(() => {});
    return res.status(500).json({ success: false, message: "Webhook processing failed" });
  }
};
