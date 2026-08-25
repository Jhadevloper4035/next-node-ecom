const EmailEvent = require("../models/emailEvent.model");
const Order = require("../models/order.model");
const PaymentTransaction = require("../models/paymentTransaction.model");
const ApiError = require("../utils/ApiError");
const { enqueueEmail } = require("../queues/email.queue");
const { isUnconfirmedPaymentState } = require("./payment-state.service");
const logger = require("../config/logger");

function failedPaymentEmailReady({ order, payment, hasPaidAttempt }) {
  if (!isUnconfirmedPaymentState(payment?.status) || !["FAILED", "USER_DROPPED", "CANCELLED", "VOID"].includes(payment?.cashfreeStatus) || hasPaidAttempt) return false;
  if (order.status === "cancelled") return true;
  return order.status === "pending_payment"
    && order.expiresAt > new Date()
    && String(order.activePaymentTransaction) === String(payment?._id);
}

async function emailEventReady(emailEvent) {
  if (emailEvent.type === "orderReserved") {
    const order = await Order.findById(emailEvent.order);
    return Boolean(order?.status === "pending_payment" && order.expiresAt > new Date());
  }
  if (emailEvent.type === "checkoutExpired") {
    const order = await Order.findById(emailEvent.order);
    return Boolean(order?.status === "cancelled" && order.paymentStatus === "failed");
  }
  if (emailEvent.type !== "paymentFailed") return true;
  const [order, payment] = await Promise.all([
    Order.findById(emailEvent.order),
    emailEvent.paymentTransaction && PaymentTransaction.findById(emailEvent.paymentTransaction),
  ]);
  if (!order || !payment) return false;
  const hasPaidAttempt = await PaymentTransaction.exists({ order: order._id, status: "paid" });
  return failedPaymentEmailReady({ order, payment, hasPaidAttempt });
}

async function enqueueDurableEmail(emailEvent, { manual = false } = {}) {
  let event = emailEvent;
  if (manual) {
    event = await EmailEvent.findByIdAndUpdate(event._id, { $inc: { manualResendCount: 1 } }, { new: true });
  }
  const ready = await emailEventReady(event);
  if (!ready) {
    await EmailEvent.updateOne({ _id: event._id }, { $set: { status: "ignored", finalError: "Email is no longer valid for the current order state" } });
    if (manual) throw new ApiError(409, "This email is no longer valid for the current order state");
    return null;
  }
  try {
    await enqueueEmail({
      type: event.type,
      to: event.to,
      data: event.data,
      emailEventId: event._id.toString(),
      jobId: `email-event-${event._id}-${event.manualResendCount}-${event.attemptCount}`,
    }, { requireQueue: true });
    await EmailEvent.updateOne(
      { _id: event._id, status: { $in: ["pending", "failed", "ignored"] } },
      { $set: { status: "queued", finalError: "" } },
    );
    return event;
  } catch (error) {
    await EmailEvent.updateOne(
      { _id: event._id },
      { $set: { status: "failed", lastAttemptAt: new Date(), finalError: error.message } },
    );
    logger.error({ err: error, alert: true, event: "email_queue_unavailable", emailEventId: event._id }, "Email queue is unavailable");
    throw error;
  }
}

async function queueEmailEvent({ outboxEvent, type, order, paymentTransaction, refund, to, data }) {
  const emailEvent = await EmailEvent.findOneAndUpdate(
    { outboxEvent: outboxEvent._id },
    { $setOnInsert: {
      outboxEvent: outboxEvent._id,
      order: order._id,
      paymentTransaction: paymentTransaction?._id || paymentTransaction || null,
      refund: refund?._id || refund || null,
      type,
      to,
      data,
      dedupeKey: `EMAIL:${outboxEvent._id}`,
    } },
    { new: true, upsert: true },
  );
  if (["queued", "sending", "sent"].includes(emailEvent.status)) return emailEvent;
  return enqueueDurableEmail(emailEvent);
}

async function recoverFailedEmailEvents() {
  const staleBefore = new Date(Date.now() - 60_000);
  const events = await EmailEvent.find({ status: "failed", lastAttemptAt: { $lte: staleBefore } }).sort({ lastAttemptAt: 1 }).limit(100);
  for (const event of events) {
    try {
      await enqueueDurableEmail(event);
    } catch (error) {
      logger.error({ err: error, event: "email_recovery_failed", emailEventId: event._id }, "Email recovery failed");
    }
  }
  return events.length;
}

module.exports = { emailEventReady, enqueueDurableEmail, failedPaymentEmailReady, queueEmailEvent, recoverFailedEmailEvents };
