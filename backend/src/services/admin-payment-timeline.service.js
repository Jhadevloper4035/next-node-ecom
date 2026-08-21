const ApiError = require("../utils/ApiError");
const Order = require("../models/order.model");
const PaymentTransaction = require("../models/paymentTransaction.model");
const PaymentWebhookEvent = require("../models/paymentWebhookEvent.model");
const PaymentReconciliationAction = require("../models/paymentReconciliationAction.model");
const Refund = require("../models/refund.model");
const EmailEvent = require("../models/emailEvent.model");
const FinancialAuditLog = require("../models/financialAuditLog.model");

const byTime = (items) => [...items].sort((left, right) => new Date(left.createdAt || left.at) - new Date(right.createdAt || right.at));

function reservationStatus(order) {
  if (order.status === "pending_payment") return "held";
  if (["confirmed", "processing", "shipped", "delivered", "refund_pending", "partially_refunded", "refunded"].includes(order.status)) return "consumed";
  return "released";
}

async function getAdminPaymentTimeline(query) {
  let order = await Order.findOne({ orderNumber: query });
  if (!order) {
    const payment = await PaymentTransaction.findOne({ $or: [{ cfPaymentId: query }, { cfOrderId: query }] });
    if (payment) order = await Order.findById(payment.order);
  }
  if (!order) throw new ApiError(404, "Order not found");

  const attempts = await PaymentTransaction.find({ order: order._id });
  const paymentIds = attempts.map((attempt) => attempt.cfPaymentId).filter(Boolean);
  const cashfreeOrderIds = attempts.map((attempt) => attempt.cfOrderId).filter(Boolean);
  const [refunds, webhooks, reconciliations, emails, audits] = await Promise.all([
    Refund.find({ order: order._id }),
    PaymentWebhookEvent.find({ $or: [{ orderId: order.orderNumber }, ...(paymentIds.length ? [{ cfPaymentId: { $in: paymentIds } }] : []), ...(cashfreeOrderIds.length ? [{ cfOrderId: { $in: cashfreeOrderIds } }] : [])] }),
    PaymentReconciliationAction.find({ order: order._id }),
    EmailEvent.find({ order: order._id }),
    FinancialAuditLog.find({ order: order._id }),
  ]);

  const timeline = byTime([
    ...attempts.map((attempt) => ({ type: "payment_attempt", at: attempt.processedAt || attempt.createdAt, status: attempt.status, paymentId: attempt.cfPaymentId || "", details: { cashfreeStatus: attempt.cashfreeStatus || "" } })),
    ...webhooks.map((webhook) => ({ type: "webhook", at: webhook.processedAt || webhook.receivedAt || webhook.createdAt, status: webhook.status, paymentId: webhook.cfPaymentId, details: { eventType: webhook.eventType, signatureValid: webhook.signatureValid, error: webhook.processingError, duplicateCount: webhook.duplicateCount } })),
    ...reconciliations.map((action) => ({ type: "reconciliation", at: action.createdAt, status: action.type, paymentId: action.cfPaymentId, details: action.details })),
    ...refunds.map((refund) => ({ type: "refund", at: refund.updatedAt || refund.createdAt, status: refund.status, details: { refundId: refund.refundId, amountPaise: refund.amountPaise, reason: refund.reason, cashfreeStatus: refund.cashfreeStatus } })),
    ...emails.map((email) => ({ type: "email", at: email.lastAttemptAt || email.createdAt, status: email.status, details: { type: email.type, to: email.to, error: email.finalError } })),
    ...audits.map((audit) => ({ type: "audit", at: audit.createdAt, status: audit.action, paymentId: audit.paymentId, details: { actorType: audit.actorType, previousState: audit.previousState, newState: audit.newState, reason: audit.details?.reason } })),
  ]);

  return {
    order: {
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      pricing: order.pricing,
      createdAt: order.createdAt,
      expiresAt: order.expiresAt,
    },
    attempts: byTime(attempts).map((attempt) => ({ attemptNumber: attempt.attemptNumber, gateway: attempt.gateway, status: attempt.status, cashfreeStatus: attempt.cashfreeStatus, cfOrderId: attempt.cfOrderId, cfPaymentId: attempt.cfPaymentId, amountPaise: attempt.amountPaise, currency: attempt.currency, pendingSince: attempt.pendingSince, processedAt: attempt.processedAt, createdAt: attempt.createdAt })),
    webhooks: byTime(webhooks).map((webhook) => ({ eventType: webhook.eventType, cfPaymentId: webhook.cfPaymentId, cfOrderId: webhook.cfOrderId, signatureValid: webhook.signatureValid, status: webhook.status, processingError: webhook.processingError, duplicateCount: webhook.duplicateCount, receivedAt: webhook.receivedAt, processedAt: webhook.processedAt })),
    reconciliations: byTime(reconciliations).map((action) => ({ type: action.type, cfPaymentId: action.cfPaymentId, details: action.details, createdAt: action.createdAt })),
    refunds: byTime(refunds).map((refund) => ({ refundId: refund.refundId, cfRefundId: refund.cfRefundId, kind: refund.kind, amountPaise: refund.amountPaise, reason: refund.reason, status: refund.status, cashfreeStatus: refund.cashfreeStatus, createdAt: refund.createdAt, updatedAt: refund.updatedAt })),
    stockReservation: { status: reservationStatus(order), expiresAt: order.expiresAt, items: order.items.map(({ title, quantity }) => ({ title, quantity })) },
    emails: byTime(emails).map((email) => ({ id: email._id, type: email.type, to: email.to, status: email.status, attemptCount: email.attemptCount, manualResendCount: email.manualResendCount, sentAt: email.sentAt, lastAttemptAt: email.lastAttemptAt, finalError: email.finalError })),
    timeline,
  };
}

module.exports = { getAdminPaymentTimeline, reservationStatus };
