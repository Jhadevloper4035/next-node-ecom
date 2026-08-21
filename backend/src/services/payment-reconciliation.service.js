const crypto = require("crypto");
const Order = require("../models/order.model");
const PaymentReconciliationAction = require("../models/paymentReconciliationAction.model");
const { paymentAttemptForGateway } = require("./checkout.service");
const { getCashfreePayments } = require("./payment.service");
const { applyCashfreePaymentState, flagSuccessfulPaymentForReview, isUnconfirmedPaymentState, recordFailedPaymentEmail, resolveSuccessfulPayment } = require("./payment-state.service");
const { env } = require("../config/env");
const { paymentAmountPaise, paymentVerificationError } = require("./payment-verification.service");
const { releaseCouponReservation } = require("./coupon-lifecycle.service");
const { recordFinancialAudit } = require("./financial-audit.service");

// ponytail: process-local overlap guard; database idempotency protects multiple app instances.
let isReconciling = false;

function successfulPayments(payments) {
  return payments.filter((payment) => payment.payment_status === "SUCCESS").sort((left, right) => {
    return new Date(left.payment_completion_time || 0) - new Date(right.payment_completion_time || 0);
  });
}

function reconciliationDecision({ order, payment, successCount }) {
  const paidPaise = paymentAmountPaise(payment.payment_amount);
  if (paidPaise === null || paidPaise !== order.pricing.advancePaise) return "amount_mismatch";
  if (payment.payment_currency !== order.pricing.currency) return "currency_mismatch";
  if (successCount > 1) return "duplicate_payment";
  return "confirm";
}

function pendingReviewDue(order, attempt, now = new Date()) {
  const pendingSince = attempt.pendingSince || attempt.createdAt || order.createdAt;
  return Boolean(pendingSince && now - new Date(pendingSince) >= env.pendingPaymentReviewMinutes * 60_000);
}

function isCurrentConfirmedPayment(order, attempt, payment, successCount) {
  const paymentTransactionId = order.paymentTransaction?._id || order.paymentTransaction;
  return order.status === "confirmed"
    && successCount === 1
    && String(paymentTransactionId) === String(attempt._id)
    && String(attempt.cfPaymentId) === String(payment.cf_payment_id);
}

async function recordAction({ order, attempt, paymentId, type, details = {} }) {
  const dedupeKey = crypto.createHash("sha256")
    .update(`${order._id}:${paymentId || ""}:${type}`)
    .digest("hex");
  await PaymentReconciliationAction.updateOne(
    { dedupeKey },
    { $setOnInsert: { order: order._id, paymentTransaction: attempt?._id || null, cfPaymentId: paymentId || "", type, details, dedupeKey } },
    { upsert: true },
  );
}

async function markOrderForReview(order, type) {
  const reviewStatus = ["cancelled", "payment_received_after_cancellation"].includes(order.status)
    ? "payment_received_after_cancellation"
    : "payment_review_required";
  const result = await Order.updateOne(
    { _id: order._id, status: { $in: ["pending_payment", "payment_failed", "cancel_requested", "cancelled", "confirmed", "processing", "payment_review_required", "payment_received_after_cancellation"] } },
    { $set: { status: reviewStatus, paymentStatus: "paid", activePaymentTransaction: null } },
  );
  if (result.modifiedCount) await recordFinancialAudit({ actorType: "system_reconciliation", order: order._id, action: "order_status_updated", previousState: { status: order.status, paymentStatus: order.paymentStatus }, newState: { status: reviewStatus, paymentStatus: "paid" }, correlationId: `RECONCILIATION:${order._id}:${type}`, details: { reason: type } });
  await recordAction({ order, type });
}

async function attemptForPayment(order, payment) {
  const activeTransaction = order.activePaymentTransaction || order.paymentTransaction;
  const paymentId = String(payment.cf_payment_id || "");
  return paymentAttemptForGateway({ order, activeTransaction, paymentId, actorType: "system_reconciliation", correlationId: `RECONCILIATION:${order._id}:${paymentId}` });
}

async function reconcileOrder(order) {
  const payments = await getCashfreePayments(order.orderNumber);
  const successes = successfulPayments(payments);

  if (successes.some((payment) => !payment.cf_payment_id)) {
    await markOrderForReview(order, "missing_attempt");
    return "review_required";
  }

  for (const payment of payments) {
    if (payment.payment_status === "SUCCESS") continue;
    const attempt = await attemptForPayment(order, payment);
    if (!attempt) continue;
    const result = await applyCashfreePaymentState({ attempt, cashfreeStatus: payment.payment_status, paymentId: String(payment.cf_payment_id || ""), rawPayload: JSON.stringify(payment), actorType: "system_reconciliation", correlationId: `RECONCILIATION:${order._id}:${payment.cf_payment_id || ""}` });
    if (["failed", "cancelled"].includes(result.state)) await releaseCouponReservation(order);
    if (isUnconfirmedPaymentState(result.state)) await recordFailedPaymentEmail({ order, attempt });
    if (result.state === "pending" && pendingReviewDue(order, attempt)) {
      await recordAction({ order, attempt, paymentId: String(payment.cf_payment_id || ""), type: "pending_payment_review" });
    }
  }

  if (!successes.length) return "checked";
  const attempts = [];
  for (const payment of successes) {
    const attempt = await attemptForPayment(order, payment);
    if (!attempt) {
      await markOrderForReview(order, "missing_attempt");
      return "review_required";
    }
    attempts.push(attempt);
  }

  const firstPayment = successes[0];
  const decision = reconciliationDecision({ order, payment: firstPayment, successCount: successes.length });
  if (decision === "amount_mismatch" || decision === "currency_mismatch") {
    await flagSuccessfulPaymentForReview({ order, attempt: attempts[0], paymentId: String(firstPayment.cf_payment_id), rawPayload: JSON.stringify(firstPayment), reason: decision, actorType: "system_reconciliation", correlationId: `RECONCILIATION:${order._id}:${firstPayment.cf_payment_id}` });
    await recordAction({ order, attempt: attempts[0], paymentId: String(firstPayment.cf_payment_id), type: decision });
    return "review_required";
  }

  const verificationError = paymentVerificationError({
    order,
    attempt: attempts[0],
    payment: firstPayment,
    merchantOrderId: firstPayment.order_id || order.orderNumber,
    cashfreeOrderId: firstPayment.cf_order_id,
  });
  if (verificationError) {
    const type = verificationError === "Payment currency mismatch" ? "currency_mismatch" : verificationError === "Payment amount mismatch" || verificationError === "Payment amount is invalid" ? "amount_mismatch" : "cashfree_order_mismatch";
    await flagSuccessfulPaymentForReview({ order, attempt: attempts[0], paymentId: String(firstPayment.cf_payment_id), rawPayload: JSON.stringify(firstPayment), reason: type, actorType: "system_reconciliation", correlationId: `RECONCILIATION:${order._id}:${firstPayment.cf_payment_id}` });
    await recordAction({ order, attempt: attempts[0], paymentId: String(firstPayment.cf_payment_id), type, details: { verificationError } });
    return "review_required";
  }

  if (decision === "duplicate_payment") {
    await flagSuccessfulPaymentForReview({ order, attempt: attempts[1], paymentId: String(successes[1].cf_payment_id), rawPayload: JSON.stringify(successes[1]), reason: "duplicate_payment", canonicalAttempt: attempts[0], relatedAttempts: attempts, actorType: "system_reconciliation", correlationId: `RECONCILIATION:${order._id}:${successes[1].cf_payment_id}` });
    await recordAction({ order, attempt: attempts[1], paymentId: String(successes[1].cf_payment_id), type: "duplicate_payment", details: { successfulPaymentIds: successes.map((payment) => String(payment.cf_payment_id)) } });
    return "review_required";
  }

  if (isCurrentConfirmedPayment(order, attempts[0], firstPayment, successes.length)) return "checked";

  const result = await resolveSuccessfulPayment({ order, attempt: attempts[0], paymentId: String(firstPayment.cf_payment_id), rawPayload: JSON.stringify(firstPayment), actorType: "system_reconciliation", correlationId: `RECONCILIATION:${order._id}:${firstPayment.cf_payment_id}` });
  if (result.outcome === "confirmed") {
    await recordAction({ order, attempt: attempts[0], paymentId: String(firstPayment.cf_payment_id), type: "confirmed" });
    return "confirmed";
  }
  await recordAction({ order, attempt: attempts[0], paymentId: String(firstPayment.cf_payment_id), type: result.reason === "duplicate_payment" ? "duplicate_payment" : "late_payment" });
  return "review_required";
}

async function reconcilePayments() {
  if (isReconciling) return { skipped: true };
  isReconciling = true;
  const summary = { checked: 0, confirmed: 0, reviewRequired: 0, failed: 0 };
  try {
    const orders = await Order.find({ status: { $in: ["pending_payment", "payment_failed", "cancel_requested", "cancelled", "confirmed", "processing"] } })
      .sort({ lastPaymentReconciledAt: 1 })
      .limit(100)
      .populate(["activePaymentTransaction", "paymentTransaction"]);
    for (const order of orders) {
      try {
        const outcome = await reconcileOrder(order);
        summary.checked += 1;
        if (outcome === "confirmed") summary.confirmed += 1;
        if (outcome === "review_required") summary.reviewRequired += 1;
        await Order.updateOne({ _id: order._id }, { $set: { lastPaymentReconciledAt: new Date() } });
      } catch (error) {
        summary.failed += 1;
        console.error(`Payment reconciliation failed for ${order.orderNumber}:`, error.message);
      }
    }
    return summary;
  } finally {
    isReconciling = false;
  }
}

module.exports = { isCurrentConfirmedPayment, reconcilePayments, reconciliationDecision, successfulPayments, pendingReviewDue };
