const crypto = require("crypto");
const Order = require("../models/order.model");
const PaymentTransaction = require("../models/paymentTransaction.model");
const Refund = require("../models/refund.model");
const ApiError = require("../utils/ApiError");
const { createCashfreeRefund, getCashfreeRefunds } = require("./payment.service");
const { recordOutboxEvent } = require("./outbox.service");
const { redactPaymentData } = require("../utils/paymentPayload");
const { paymentAmountPaise } = require("./payment-verification.service");
const { recordFinancialAudit } = require("./financial-audit.service");
const logger = require("../config/logger");

const refundId = () => `RF${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
const refundableStatuses = ["confirmed", "processing", "cancel_requested", "cancelled", "payment_review_required", "payment_received_after_cancellation", "refund_pending", "partially_refunded"];

function refundStatus(cashfreeStatus) {
  if (cashfreeStatus === "SUCCESS") return "success";
  if (cashfreeStatus === "PENDING") return "pending";
  if (["FAILED", "CANCELLED"].includes(cashfreeStatus)) return cashfreeStatus.toLowerCase();
  return "review_required";
}

function recordRefundCompleted(refund) {
  return recordOutboxEvent({ type: "REFUND_COMPLETED", order: refund.order, paymentTransaction: refund.paymentTransaction, refund: refund._id, dedupeKey: `REFUND_COMPLETED:${refund._id}` });
}

async function recordDuplicatePaymentResolution(refund) {
  await recordRefundCompleted(refund);
  await recordOutboxEvent({ type: "DUPLICATE_PAYMENT_RESOLVED", order: refund.order, paymentTransaction: refund.paymentTransaction, refund: refund._id, dedupeKey: `DUPLICATE_PAYMENT_RESOLVED:${refund._id}` });
}

function recordRefundTransition(refund, previousStatus, newStatus, audit = {}) {
  if (previousStatus === newStatus) return null;
  return recordFinancialAudit({ ...audit, actorType: audit.actorType || "cashfree_webhook", order: refund.order, paymentTransaction: refund.paymentTransaction, refund: refund._id, action: "refund_status_updated", previousState: { status: previousStatus }, newState: { status: newStatus }, paymentId: audit.paymentId || refund.cfRefundId });
}

async function releaseRefundReservation(refund, audit) {
  const order = await Order.findOneAndUpdate(
    { _id: refund.order, releasedRefundIds: { $ne: refund._id } },
    { $inc: { refundReservedPaise: -refund.amountPaise }, $addToSet: { releasedRefundIds: refund._id } },
    { new: true },
  );
  if (order && order.refundReservedPaise === 0) {
    const partiallyRefunded = order.refundedPaise > 0;
    await Order.updateOne(
      { _id: order._id },
      { $set: { status: partiallyRefunded ? "partially_refunded" : refund.previousOrderStatus, paymentStatus: partiallyRefunded ? "partially_refunded" : refund.previousPaymentStatus } },
    );
    await recordFinancialAudit({ ...audit, actorType: audit?.actorType || "cashfree_webhook", order: order._id, paymentTransaction: refund.paymentTransaction, refund: refund._id, action: "order_status_updated", previousState: { status: "refund_pending", paymentStatus: "refund_pending" }, newState: { status: partiallyRefunded ? "partially_refunded" : refund.previousOrderStatus, paymentStatus: partiallyRefunded ? "partially_refunded" : refund.previousPaymentStatus }, correlationId: audit?.correlationId || "", paymentId: audit?.paymentId || refund.cfRefundId });
  }
  await Refund.updateOne({ _id: refund._id, reservationReleasedAt: null }, { $set: { reservationReleasedAt: new Date() } });
  return order;
}

async function applySuccessfulRefund(refund, audit) {
  const order = await Order.findOneAndUpdate(
    { _id: refund.order, appliedRefundIds: { $ne: refund._id } },
    { $inc: { refundReservedPaise: -refund.amountPaise, refundedPaise: refund.amountPaise }, $addToSet: { appliedRefundIds: refund._id }, $set: { status: "refund_pending", paymentStatus: "refund_pending" } },
    { new: true },
  );
  const currentOrder = order || await Order.findById(refund.order);
  if (!currentOrder) return null;
  const payment = await PaymentTransaction.findById(refund.paymentTransaction);
  const complete = payment && currentOrder.refundedPaise >= payment.amountPaise;
  await Order.updateOne({ _id: currentOrder._id }, { $set: { status: complete ? "refunded" : "partially_refunded", paymentStatus: complete ? "refunded" : "partially_refunded" } });
  if (payment) {
    const previousPaymentStatus = payment.status;
    payment.status = complete ? "refunded" : "partially_refunded";
    await payment.save();
    await recordFinancialAudit({ ...audit, actorType: audit?.actorType || "cashfree_webhook", order: currentOrder._id, paymentTransaction: payment._id, refund: refund._id, action: "payment_status_updated", previousState: { status: previousPaymentStatus }, newState: { status: payment.status }, correlationId: audit?.correlationId || "", paymentId: audit?.paymentId || payment.cfPaymentId || refund.cfRefundId });
  }
  await recordFinancialAudit({ ...audit, actorType: audit?.actorType || "cashfree_webhook", order: currentOrder._id, paymentTransaction: refund.paymentTransaction, refund: refund._id, action: "order_status_updated", previousState: { status: "refund_pending", paymentStatus: "refund_pending" }, newState: { status: complete ? "refunded" : "partially_refunded", paymentStatus: complete ? "refunded" : "partially_refunded" }, correlationId: audit?.correlationId || "", paymentId: audit?.paymentId || refund.cfRefundId });
  await Refund.updateOne({ _id: refund._id, appliedAt: null }, { $set: { appliedAt: new Date() } });
  return currentOrder;
}

async function applyDuplicatePaymentAutoRefund(refund, response, state, audit) {
  const updated = await Refund.findOneAndUpdate(
    { _id: refund._id, status: { $ne: "success" } },
    { $set: { status: state, cashfreeStatus: response.refund_status || "", cfRefundId: String(response.cf_refund_id || refund.cfRefundId), rawResponse: redactPaymentData(response), ...(state === "success" && { appliedAt: new Date() }) } },
    { new: true },
  );
  if (!updated) {
    const current = await Refund.findById(refund._id);
    if (current?.status === "success") await recordDuplicatePaymentResolution(current);
    return current;
  }
  await recordRefundTransition(updated, refund.status, updated.status, audit);
  if (state !== "success") return updated;

  const payment = await PaymentTransaction.findOneAndUpdate(
    { _id: updated.paymentTransaction, cfPaymentId: String(response.cf_payment_id || ""), status: "review_required" },
    { $set: { status: "refunded", cashfreeStatus: "AUTO_REFUND", processedAt: new Date() } },
    { new: true },
  );
  if (payment) {
    await recordFinancialAudit({ ...audit, actorType: audit?.actorType || "cashfree_webhook", order: updated.order, paymentTransaction: payment._id, refund: updated._id, action: "payment_status_updated", previousState: { status: "review_required" }, newState: { status: "refunded" }, correlationId: audit?.correlationId || "", paymentId: response.cf_payment_id || payment.cfPaymentId });
    await recordDuplicatePaymentResolution(updated);
    return updated;
  }

  await Refund.updateOne({ _id: updated._id }, { $set: { status: "review_required", cashfreeStatus: "LOCAL_REVIEW_REQUIRED" } });
  await recordRefundTransition(updated, updated.status, "review_required", audit);
  return Refund.findById(updated._id);
}

async function applyCashfreeRefund(refund, response, audit = {}) {
  response ||= {};
  const state = refundStatus(response.refund_status);
  if (refund.kind === "duplicate_payment_auto") return applyDuplicatePaymentAutoRefund(refund, response, state, audit);
  if (state === "pending") {
    await Refund.updateOne({ _id: refund._id, status: { $ne: "success" } }, { $set: { status: "pending", cashfreeStatus: response.refund_status, cfRefundId: response.cf_refund_id ? String(response.cf_refund_id) : refund.cfRefundId, rawResponse: redactPaymentData(response) } });
    await recordRefundTransition(refund, refund.status, "pending", audit);
    return Refund.findById(refund._id);
  }

  if (state === "review_required") {
    await recordOutboxEvent({ type: "REFUND_FAILED", order: refund.order, paymentTransaction: refund.paymentTransaction, refund: refund._id, dedupeKey: `REFUND_FAILED:${refund._id}` });
    await Refund.updateOne({ _id: refund._id, status: { $ne: "success" } }, { $set: { status: state, cashfreeStatus: response.refund_status || "", cfRefundId: response.cf_refund_id ? String(response.cf_refund_id) : refund.cfRefundId, rawResponse: redactPaymentData(response) } });
    await recordRefundTransition(refund, refund.status, state, audit);
    return Refund.findById(refund._id);
  }

  const eventType = state === "success" ? "REFUND_COMPLETED" : "REFUND_FAILED";
  await recordOutboxEvent({ type: eventType, order: refund.order, paymentTransaction: refund.paymentTransaction, refund: refund._id, dedupeKey: `${eventType}:${refund._id}` });
  const updated = await Refund.findOneAndUpdate(
    { _id: refund._id, status: { $ne: "success" } },
    { $set: { status: state, cashfreeStatus: response.refund_status || "", cfRefundId: response.cf_refund_id ? String(response.cf_refund_id) : refund.cfRefundId, rawResponse: redactPaymentData(response) } },
    { new: true },
  );
  if (!updated) return Refund.findById(refund._id);
  await recordRefundTransition(updated, refund.status, updated.status, audit);
  if (state === "success") await applySuccessfulRefund(updated, audit);
  else await releaseRefundReservation(updated, audit);
  return Refund.findById(refund._id);
}

async function recordDuplicatePaymentAutoRefund({ orderNumber, refund: response, audit = {} }) {
  const amountPaise = paymentAmountPaise(response?.refund_amount);
  const paymentId = String(response?.cf_payment_id || "");
  const cfRefundId = String(response?.cf_refund_id || "");
  if (response?.refund_type !== "PAYMENT_AUTO_REFUND" || !paymentId || !cfRefundId || amountPaise === null || amountPaise < 1) return null;

  const order = await Order.findOne({ orderNumber });
  if (!order || order.status !== "payment_review_required" || response.refund_currency !== order.pricing?.currency) return null;

  let refund = await Refund.findOne({ cfRefundId });
  if (refund) return refund.kind === "duplicate_payment_auto" && String(refund.order) === String(order._id) && refund.amountPaise === amountPaise
    ? applyCashfreeRefund(refund, response, audit)
    : null;

  const payment = await PaymentTransaction.findOne({ order: order._id, cfPaymentId: paymentId, status: "review_required" });
  if (!payment || String(payment._id) === String(order.paymentTransaction) || amountPaise !== payment.amountPaise) return null;
  try {
    refund = await Refund.create({ order: order._id, paymentTransaction: payment._id, refundId: `AUTO_${cfRefundId}`, idempotencyKey: `AUTO_DUPLICATE:${cfRefundId}`, kind: "duplicate_payment_auto", amountPaise, reason: "Duplicate payment auto-refund", previousOrderStatus: order.status, previousPaymentStatus: order.paymentStatus, status: "created", cfRefundId });
  } catch (error) {
    if (error?.code !== 11000) throw error;
    refund = await Refund.findOne({ cfRefundId });
  }
  await recordRefundTransition(refund, "", refund.status, audit);
  return applyCashfreeRefund(refund, response, audit);
}

async function initiateRefund({ orderNumber, amountPaise, reason, idempotencyKey, actor = null, actorType = "admin" }) {
  const audit = { actor, actorType, correlationId: idempotencyKey };
  const order = await Order.findOne({ orderNumber }).populate("paymentTransaction");
  if (!order) throw new ApiError(404, "Order not found");
  const existing = await Refund.findOne({ order: order._id, idempotencyKey });
  if (existing) return existing;
  if (!refundableStatuses.includes(order.status) || !order.paymentTransaction?.cfPaymentId) throw new ApiError(409, "This order cannot be refunded");
  if (!Number.isInteger(amountPaise) || amountPaise < 1) throw new ApiError(400, "Refund amount is invalid");

  if (!["paid", "partially_refunded"].includes(order.paymentTransaction.status)) throw new ApiError(409, "This payment cannot be refunded");
  let refund;
  try {
    refund = await Refund.create({ order: order._id, paymentTransaction: order.paymentTransaction._id, refundId: refundId(), idempotencyKey, amountPaise, reason, previousOrderStatus: order.status, previousPaymentStatus: order.paymentStatus });
  } catch (error) {
    if (error?.code !== 11000) throw error;
    return Refund.findOne({ order: order._id, idempotencyKey });
  }
  await recordRefundTransition(refund, "", refund.status, audit);
  const reservedOrder = await Order.findOneAndUpdate(
    { _id: order._id, status: { $in: refundableStatuses }, $expr: { $lte: [{ $add: [{ $ifNull: ["$refundReservedPaise", 0] }, amountPaise] }, order.paymentTransaction.amountPaise] } },
    { $inc: { refundReservedPaise: amountPaise }, $set: { status: "refund_pending", paymentStatus: "refund_pending" } },
    { new: true },
  );
  if (!reservedOrder) {
    await Refund.updateOne({ _id: refund._id }, { $set: { status: "failed", cashfreeStatus: "LOCAL_REJECTED" } });
    await recordRefundTransition(refund, refund.status, "failed", audit);
    throw new ApiError(409, "Refund amount exceeds the collected payment");
  }

  refund.status = "pending";
  await refund.save();
  await recordFinancialAudit({ ...audit, order: order._id, paymentTransaction: order.paymentTransaction._id, refund: refund._id, action: "order_status_updated", previousState: { status: order.status, paymentStatus: order.paymentStatus }, newState: { status: reservedOrder.status, paymentStatus: reservedOrder.paymentStatus } });
  await recordRefundTransition(refund, "created", "pending", audit);
  await recordOutboxEvent({ type: "REFUND_INITIATED", order: order._id, paymentTransaction: order.paymentTransaction._id, refund: refund._id, dedupeKey: `REFUND_INITIATED:${refund._id}` });
  try {
    const response = await createCashfreeRefund({ orderNumber: order.orderNumber, refundId: refund.refundId, amountPaise, reason });
    return applyCashfreeRefund(refund, Array.isArray(response) ? response.find((item) => item.refund_id === refund.refundId) || response[0] : response, audit);
  } catch (error) {
    await Refund.updateOne({ _id: refund._id, status: "pending" }, { $set: { status: "review_required", cashfreeStatus: "UNKNOWN", rawResponse: redactPaymentData({ error: error.message }) } });
    await recordRefundTransition(refund, "pending", "review_required", audit);
    await recordOutboxEvent({ type: "REFUND_FAILED", order: order._id, paymentTransaction: order.paymentTransaction._id, refund: refund._id, dedupeKey: `REFUND_FAILED:${refund._id}` });
    return Refund.findById(refund._id);
  }
}

async function reconcileRefunds() {
  const refunds = await Refund.find({ status: { $in: ["pending", "review_required"] } }).limit(100).populate("order");
  for (const refund of refunds) {
    try {
      if (!refund.order) continue;
      const cashfreeRefunds = await getCashfreeRefunds(refund.order.orderNumber);
      const remoteRefund = cashfreeRefunds.find((item) => item.refund_id === refund.refundId || String(item.cf_refund_id) === String(refund.cfRefundId));
      if (remoteRefund) await applyCashfreeRefund(refund, remoteRefund, { actorType: "system_reconciliation", correlationId: `REFUND_RECONCILIATION:${refund._id}`, paymentId: refund.cfRefundId });
    } catch (error) {
      logger.error({ err: error, event: "refund_reconciliation_failed", refundId: refund.refundId }, "Refund reconciliation failed");
    }
  }
}

module.exports = { applyCashfreeRefund, initiateRefund, reconcileRefunds, recordDuplicatePaymentAutoRefund, refundStatus };
