const { env } = require("../config/env");
const Order = require("../models/order.model");
const PaymentTransaction = require("../models/paymentTransaction.model");
const PaymentWebhookEvent = require("../models/paymentWebhookEvent.model");
const PaymentGatewayCall = require("../models/paymentGatewayCall.model");
const FinancialAuditLog = require("../models/financialAuditLog.model");
const Refund = require("../models/refund.model");
const EmailEvent = require("../models/emailEvent.model");
const { getEventQueue } = require("../queues/event.queue");
const { getEmailQueue } = require("../queues/email.queue");

const percentage = (count, total) => total ? Number(((count / total) * 100).toFixed(1)) : 0;

async function queueMetrics(getQueue) {
  try {
    const queue = getQueue();
    if (!queue) return { available: false, failed: 0, depth: 0 };
    const counts = await queue.getJobCounts("waiting", "active", "delayed", "failed");
    return {
      available: true,
      failed: counts.failed || 0,
      depth: (counts.waiting || 0) + (counts.active || 0) + (counts.delayed || 0),
    };
  } catch {
    return { available: false, failed: 0, depth: 0 };
  }
}

async function getMonitoringSnapshot(now = new Date()) {
  const pendingBefore = new Date(now.getTime() - env.pendingPaymentReviewMinutes * 60_000);
  const refundPendingBefore = new Date(now.getTime() - 24 * 60 * 60_000);
  const [
    paid, failed, pending, userDropped, successByMethod, cashfreeFailures, cashfreeLatency,
    invalidWebhookSignatures, webhookFailures, duplicateWebhooks, duplicateSuccessfulPayments,
    successAfterExpiry, successAfterCancellation, amountMismatches, currencyMismatches,
    oldPendingPayments, refundFailures, oldRefundPending, emailFailures, inventoryReservationLeaks,
    eventQueue, emailQueue,
  ] = await Promise.all([
    PaymentTransaction.countDocuments({ status: "paid" }),
    PaymentTransaction.countDocuments({ status: "failed" }),
    PaymentTransaction.countDocuments({ status: "pending" }),
    PaymentTransaction.countDocuments({ status: "user_dropped" }),
    PaymentTransaction.aggregate([
      { $match: { status: "paid" } },
      { $lookup: { from: "orders", localField: "order", foreignField: "_id", as: "order" } },
      { $unwind: "$order" },
      { $group: { _id: "$order.paymentMethod", count: { $sum: 1 } } },
    ]),
    PaymentGatewayCall.countDocuments({ success: false }),
    PaymentGatewayCall.aggregate([{ $group: { _id: null, average: { $avg: "$durationMs" } } }]),
    PaymentWebhookEvent.countDocuments({ signatureValid: false }),
    PaymentWebhookEvent.countDocuments({ status: "failed" }),
    PaymentWebhookEvent.aggregate([{ $group: { _id: null, count: { $sum: "$duplicateCount" } } }]),
    FinancialAuditLog.countDocuments({ "details.reason": "duplicate_payment" }),
    FinancialAuditLog.countDocuments({ "details.reason": "late_payment", "newState.status": "payment_review_required" }),
    FinancialAuditLog.countDocuments({ "details.reason": "late_payment", "newState.status": "payment_received_after_cancellation" }),
    FinancialAuditLog.countDocuments({ "details.reason": "amount_mismatch" }),
    FinancialAuditLog.countDocuments({ "details.reason": "currency_mismatch" }),
    PaymentTransaction.countDocuments({ status: "pending", $or: [{ pendingSince: { $lte: pendingBefore } }, { pendingSince: null, createdAt: { $lte: pendingBefore } }] }),
    Refund.countDocuments({ status: { $in: ["failed", "cancelled", "review_required"] } }),
    Refund.countDocuments({ status: { $in: ["pending", "review_required"] }, updatedAt: { $lte: refundPendingBefore } }),
    EmailEvent.countDocuments({ status: "failed" }),
    Order.countDocuments({ status: "pending_payment", expiresAt: { $lte: now } }),
    queueMetrics(getEventQueue),
    queueMetrics(getEmailQueue),
  ]);

  return {
    generatedAt: now.toISOString(),
    payments: {
      successRate: percentage(paid, paid + failed),
      failureRate: percentage(failed, paid + failed),
      pending,
      userDropped,
      successByMethod: Object.fromEntries(successByMethod.map(({ _id, count }) => [_id || "unknown", count])),
      duplicateSuccessfulPayments,
      successAfterExpiry,
      successAfterCancellation,
      amountMismatches,
      currencyMismatches,
      oldPendingPayments,
    },
    cashfree: { failures: cashfreeFailures, averageLatencyMs: Math.round(cashfreeLatency[0]?.average || 0) },
    webhooks: { invalidSignatures: invalidWebhookSignatures, failures: webhookFailures, duplicates: duplicateWebhooks[0]?.count || 0 },
    refunds: { failures: refundFailures, oldPending: oldRefundPending },
    queues: { failedJobs: eventQueue.failed + emailQueue.failed, depth: eventQueue.depth + emailQueue.depth, events: eventQueue, email: emailQueue },
    emailFailures,
    inventoryReservationLeaks,
  };
}

module.exports = { getMonitoringSnapshot, percentage, queueMetrics };
