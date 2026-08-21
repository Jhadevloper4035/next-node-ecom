const Order = require("../models/order.model");
const PaymentTransaction = require("../models/paymentTransaction.model");
const OutboxEvent = require("../models/outboxEvent.model");
const { removePurchasedCartItems } = require("./cart.service");
const { recordOutboxEvent } = require("./outbox.service");
const { redactPaymentPayload } = require("../utils/paymentPayload");
const { consumeCouponReservation, releaseCouponReservation } = require("./coupon-lifecycle.service");
const { recordFinancialAudit } = require("./financial-audit.service");
const { withTransaction } = require("./transaction.service");

const cashfreeStates = {
  SUCCESS: "paid",
  FAILED: "failed",
  PENDING: "pending",
  USER_DROPPED: "user_dropped",
  CANCELLED: "cancelled",
  VOID: "cancelled",
  FLAGGED: "review_required",
};

const transitions = {
  created: ["created", "pending", "paid", "failed", "user_dropped", "cancelled", "review_required"],
  pending: ["pending", "paid", "failed", "user_dropped", "cancelled", "review_required"],
  failed: ["failed", "pending", "paid", "review_required"],
  user_dropped: ["user_dropped", "pending", "paid", "review_required"],
  cancelled: ["cancelled", "review_required"],
  review_required: ["review_required"],
  paid: ["paid", "refund_pending", "partially_refunded", "refunded"],
  refund_pending: ["refund_pending", "partially_refunded", "refunded"],
  partially_refunded: ["partially_refunded", "refunded"],
  refunded: ["refunded"],
};

const isUnconfirmedPaymentState = (state) => ["failed", "user_dropped", "cancelled"].includes(state);

function paymentState(cashfreeStatus) {
  return cashfreeStates[cashfreeStatus] || "review_required";
}

function canTransition(current, next) {
  return transitions[current]?.includes(next) || false;
}

async function applyCashfreePaymentState({ attempt, cashfreeStatus, paymentId, rawPayload, actor = null, actorType = "cashfree_webhook", correlationId = "" }) {
  const nextState = paymentState(cashfreeStatus);
  if (!canTransition(attempt.status, nextState)) return { attempt, state: attempt.status, changed: false };

  const previousState = { status: attempt.status, cashfreeStatus: attempt.cashfreeStatus || "" };
  attempt.status = nextState;
  attempt.cashfreeStatus = cashfreeStatus || "";
  attempt.cfPaymentId = paymentId || attempt.cfPaymentId;
  attempt.rawWebhookPayload = rawPayload ? redactPaymentPayload(rawPayload) : attempt.rawWebhookPayload;
  if (nextState === "pending") attempt.pendingSince ||= new Date();
  else attempt.pendingSince = null;
  attempt.processedAt = new Date();
  await attempt.save();
  await recordFinancialAudit({ actor, actorType, order: attempt.order, paymentTransaction: attempt._id, action: "payment_status_updated", previousState, newState: { status: nextState, cashfreeStatus: attempt.cashfreeStatus }, correlationId, paymentId: attempt.cfPaymentId });
  return { attempt, state: nextState, changed: true };
}

async function recordFailedPaymentEmail({ order, attempt }) {
  if (!isUnconfirmedPaymentState(attempt.status) || !["FAILED", "USER_DROPPED", "CANCELLED", "VOID"].includes(attempt.cashfreeStatus)) return false;
  await releaseCouponReservation(order);
  const hasPaidAttempt = await PaymentTransaction.exists({ order: order._id, status: "paid" });
  if (hasPaidAttempt) return false;
  const dedupeKey = `PAYMENT_FAILED:${order._id}`;
  await recordOutboxEvent({ type: "PAYMENT_FAILED", order: order._id, paymentTransaction: attempt._id, dedupeKey });
  if (order.status === "cancelled") {
    await OutboxEvent.updateOne(
      { dedupeKey, status: { $in: ["ignored", "failed"] } },
      { $set: { status: "pending", lastError: "", nextAttemptAt: new Date(), deliveredAt: null } },
    );
  }
  return true;
}

async function confirmPayment({ order, attempt, paymentId, rawPayload, user, actor = null, actorType = "cashfree_webhook", correlationId = "" }) {
  let confirmedOrder;
  try {
    confirmedOrder = await withTransaction(async (session) => {
      const paidAttempt = await PaymentTransaction.findOneAndUpdate(
        { _id: attempt._id, status: { $in: ["created", "pending", "failed", "user_dropped", "paid"] } },
        { $set: { status: "paid", cashfreeStatus: "SUCCESS", cfPaymentId: paymentId || attempt.cfPaymentId, rawWebhookPayload: rawPayload ? redactPaymentPayload(rawPayload) : attempt.rawWebhookPayload, pendingSince: null, processedAt: new Date() } },
        { new: true, session },
      );
      if (!paidAttempt) throw Object.assign(new Error("Payment attempt has changed"), { code: "PAYMENT_CONFIRMATION_CONFLICT" });

      const codBalanceDuePaise = order.codBalanceDuePaise || order.pricing?.balanceDuePaise || 0;
      const updatedOrder = await Order.findOneAndUpdate(
        { _id: order._id, status: "pending_payment", expiresAt: { $gt: new Date() } },
        { $set: {
          status: "confirmed",
          paymentStatus: order.paymentMethod === "cod" ? "advance_paid" : "paid",
          paymentTransaction: paidAttempt._id,
          activePaymentTransaction: null,
          ...(order.paymentMethod === "cod" && {
            advancePaidPaise: paidAttempt.amountPaise,
            advancePaidAt: new Date(),
            advancePaymentTransaction: paidAttempt._id,
            codBalanceDuePaise,
            codBalanceStatus: codBalanceDuePaise > 0 ? "due" : "not_due",
          }),
        } },
        { new: true, session },
      );
      if (!updatedOrder) throw Object.assign(new Error("Order has changed"), { code: "PAYMENT_CONFIRMATION_CONFLICT" });
      await consumeCouponReservation(updatedOrder, session);
      const events = [
        recordOutboxEvent({ type: "PAYMENT_SUCCESS", order: updatedOrder._id, paymentTransaction: paidAttempt._id, dedupeKey: `PAYMENT_SUCCESS:${paidAttempt._id}`, session }),
        recordOutboxEvent({ type: "ORDER_CONFIRMED", order: updatedOrder._id, paymentTransaction: paidAttempt._id, dedupeKey: `ORDER_CONFIRMED:${updatedOrder._id}`, session }),
      ];
      if (attempt.status !== "paid") events.push(recordFinancialAudit({ actor, actorType, order: updatedOrder._id, paymentTransaction: paidAttempt._id, action: "payment_status_updated", previousState: { status: attempt.status, cashfreeStatus: attempt.cashfreeStatus || "" }, newState: { status: "paid", cashfreeStatus: "SUCCESS" }, correlationId, paymentId: paidAttempt.cfPaymentId, session }));
      if (order.status !== updatedOrder.status) events.push(recordFinancialAudit({ actor, actorType, order: updatedOrder._id, paymentTransaction: paidAttempt._id, action: "order_status_updated", previousState: { status: order.status, paymentStatus: order.paymentStatus }, newState: { status: updatedOrder.status, paymentStatus: updatedOrder.paymentStatus }, correlationId, paymentId: paidAttempt.cfPaymentId, session }));
      await Promise.all(events);
      return updatedOrder;
    });
  } catch (error) {
    if (error.code === "PAYMENT_CONFIRMATION_CONFLICT") return null;
    throw error;
  }

  const populatedOrder = await Order.findById(confirmedOrder._id).populate("user");
  const customer = user || populatedOrder.user;
  await removePurchasedCartItems(customer._id || customer, populatedOrder.items);
  return populatedOrder;
}

async function flagSuccessfulPaymentForReview({ order, attempt, paymentId, rawPayload, reason, canonicalAttempt, relatedAttempts = [], actor = null, actorType = "cashfree_webhook", correlationId = "" }) {
  const lateCancellation = ["cancelled", "payment_received_after_cancellation"].includes(order.status);
  const reviewStatus = lateCancellation ? "payment_received_after_cancellation" : "payment_review_required";
  const paymentTransaction = reason === "duplicate_payment"
    ? canonicalAttempt?._id || order.paymentTransaction?._id || order.paymentTransaction || attempt._id
    : attempt._id;
  const reviewAttempts = [...new Map([attempt, ...relatedAttempts]
    .filter((candidate) => candidate?.status !== "paid")
    .map((candidate) => [String(candidate._id), candidate])).values()];
  const processedAt = new Date();
  const safePayload = rawPayload ? redactPaymentPayload(rawPayload) : attempt.rawWebhookPayload;
  const previousPaymentStates = new Map(reviewAttempts.map((candidate) => [String(candidate._id), { status: candidate.status, cashfreeStatus: candidate.cashfreeStatus || "" }]));
  const { reviewedAttempts, reviewedOrder } = await withTransaction(async (session) => {
    const reviewedAttempts = await Promise.all(reviewAttempts.map((candidate) => PaymentTransaction.findOneAndUpdate(
      { _id: candidate._id, status: { $ne: "paid" } },
      { $set: { status: "review_required", cashfreeStatus: "SUCCESS", ...(String(candidate._id) === String(attempt._id) && { cfPaymentId: paymentId || candidate.cfPaymentId, rawWebhookPayload: safePayload }), processedAt } },
      { new: true, session },
    )));
    const reviewedOrder = await Order.findOneAndUpdate(
      { _id: order._id, status: { $in: ["pending_payment", "payment_failed", "cancel_requested", "cancelled", "confirmed", "processing", "payment_review_required", "payment_received_after_cancellation"] } },
      { $set: { status: reviewStatus, paymentStatus: "paid", paymentTransaction, activePaymentTransaction: null } },
      { new: true, session },
    );
    const audits = reviewedAttempts.filter(Boolean).map((updatedAttempt) => recordFinancialAudit({ actor, actorType, order: order._id, paymentTransaction: updatedAttempt._id, action: "payment_status_updated", previousState: previousPaymentStates.get(String(updatedAttempt._id)), newState: { status: "review_required", cashfreeStatus: "SUCCESS" }, correlationId, paymentId: updatedAttempt.cfPaymentId, details: { reason }, session }));
    if (reviewedOrder && order.status !== reviewedOrder.status) audits.push(recordFinancialAudit({ actor, actorType, order: order._id, paymentTransaction, action: "order_status_updated", previousState: { status: order.status, paymentStatus: order.paymentStatus }, newState: { status: reviewedOrder.status, paymentStatus: reviewedOrder.paymentStatus }, correlationId, paymentId, details: { reason }, session }));
    await Promise.all(audits);
    return { reviewedAttempts, reviewedOrder };
  });
  for (const candidate of reviewAttempts) {
    candidate.status = "review_required";
    candidate.cashfreeStatus = "SUCCESS";
    candidate.processedAt = processedAt;
  }
  return { outcome: "review_required", order: reviewedOrder || order, reason };
}

async function resolveSuccessfulPayment({ order, attempt, paymentId, rawPayload, user, actor = null, actorType = "cashfree_webhook", correlationId = "" }) {
  const hasAnotherSuccess = await PaymentTransaction.exists({
    order: order._id,
    status: "paid",
    cfPaymentId: { $ne: attempt.cfPaymentId },
  });
  if (hasAnotherSuccess) return flagSuccessfulPaymentForReview({ order, attempt, paymentId, rawPayload, reason: "duplicate_payment", actor, actorType, correlationId });

  if (order.status !== "pending_payment" || order.expiresAt <= new Date()) {
    return flagSuccessfulPaymentForReview({ order, attempt, paymentId, rawPayload, reason: "late_payment", actor, actorType, correlationId });
  }

  const confirmedOrder = await confirmPayment({ order, attempt, paymentId, rawPayload, user, actor, actorType, correlationId });
  if (confirmedOrder) return { outcome: "confirmed", order: confirmedOrder };

  const currentOrder = await Order.findById(order._id);
  if (currentOrder?.status === "confirmed" && String(currentOrder.paymentTransaction) === String(attempt._id)) return { outcome: "confirmed", order: currentOrder };
  return flagSuccessfulPaymentForReview({ order: currentOrder || order, attempt, paymentId, rawPayload, reason: "concurrent_order_update", actor, actorType, correlationId });
}

module.exports = { applyCashfreePaymentState, canTransition, confirmPayment, flagSuccessfulPaymentForReview, isUnconfirmedPaymentState, recordFailedPaymentEmail, resolveSuccessfulPayment, paymentState };
