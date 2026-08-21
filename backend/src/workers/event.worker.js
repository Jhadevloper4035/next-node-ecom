const { Worker } = require("bullmq");
const { getQueueRedis } = require("../config/queueRedis");
const OutboxEvent = require("../models/outboxEvent.model");
const Order = require("../models/order.model");
const PaymentTransaction = require("../models/paymentTransaction.model");
const Refund = require("../models/refund.model");
const { env } = require("../config/env");
const { failedPaymentEmailReady, queueEmailEvent } = require("../services/email-event.service");

let eventWorker = null;

const plain = (value) => value?.toObject ? value.toObject() : value;
const emailOrder = (order) => {
  const data = { ...plain(order) };
  delete data.user;
  return data;
};

async function queueEventEmail({ event, type, order, payment, refund, to = order.user.email }) {
  await queueEmailEvent({
    outboxEvent: event,
    type,
    order,
    paymentTransaction: payment,
    refund,
    to,
    data: { order: emailOrder(order), ...(payment && { attempt: plain(payment) }), ...(refund && { refund: plain(refund) }) },
  });
  return true;
}

async function sendEventEmail(event) {
  const order = await Order.findById(event.order).populate("user");
  if (!order) return false;
  const refund = event.refund && await Refund.findById(event.refund);
  if (event.type === "DUPLICATE_PAYMENT_RESOLVED" && refund?.status === "success" && env.supportEmail) {
    return queueEventEmail({ event, type: "duplicatePaymentResolvedSupport", order, refund, to: env.supportEmail });
  }
  if (!order.user?.email) return false;
  if (event.type === "ORDER_RESERVED") {
    if (order.status !== "pending_payment" || order.expiresAt <= new Date()) return false;
    return queueEventEmail({ event, type: "orderReserved", order });
  }
  if (event.type === "ORDER_CONFIRMED") {
    if (order.status === "pending_payment") throw new Error("Order confirmation event is not ready");
    if (order.status !== "confirmed") return false;
    const payment = event.paymentTransaction && await PaymentTransaction.findById(event.paymentTransaction);
    return queueEventEmail({ event, type: "orderConfirmed", order, payment });
  }
  if (event.type === "PAYMENT_FAILED") {
    const payment = event.paymentTransaction && await PaymentTransaction.findById(event.paymentTransaction);
    const hasPaidAttempt = await PaymentTransaction.exists({ order: order._id, status: "paid" });
    if (!failedPaymentEmailReady({ order, payment, hasPaidAttempt })) return false;
    return queueEventEmail({ event, type: "paymentFailed", order, payment });
  }
  if (event.type === "CHECKOUT_EXPIRED") {
    if (order.status !== "cancelled" || order.paymentStatus !== "failed") return false;
    return queueEventEmail({ event, type: "checkoutExpired", order });
  }

  if (event.type === "REFUND_INITIATED" && refund?.status === "created") throw new Error("Refund event is not ready");
  if (event.type === "REFUND_INITIATED" && refund?.status === "pending" && refund.cfRefundId) {
    return queueEventEmail({ event, type: "refundInitiated", order, refund });
  }
  if (event.type === "REFUND_COMPLETED" && ["created", "pending", "review_required"].includes(refund?.status)) throw new Error("Refund event is not ready");
  if (event.type === "REFUND_COMPLETED" && refund?.status === "success") {
    return queueEventEmail({ event, type: "refundCompleted", order, refund });
  }
  if (event.type === "REFUND_FAILED" && ["created", "pending"].includes(refund?.status)) throw new Error("Refund event is not ready");
  if (event.type === "REFUND_FAILED" && ["failed", "cancelled", "review_required"].includes(refund?.status)) {
    return queueEventEmail({ event, type: "refundFailed", order, refund });
  }
  return false;
}

function startEventWorker() {
  const connection = getQueueRedis();
  if (!connection || eventWorker) return eventWorker;
  eventWorker = new Worker("domain-events", async (job) => {
    const event = await OutboxEvent.findById(job.data.eventId);
    if (!event || ["delivered", "ignored"].includes(event.status)) return;
    const sent = await sendEventEmail(event);
    await OutboxEvent.updateOne({ _id: event._id }, { $set: { status: sent || event.type === "PAYMENT_SUCCESS" ? "delivered" : "ignored", deliveredAt: new Date() } });
  }, { connection });
  eventWorker.on("failed", async (job, error) => {
    if (job && job.attemptsMade >= (job.opts.attempts || 1)) {
      await OutboxEvent.updateOne({ _id: job.data.eventId, status: "queued" }, { $set: { status: "failed", lastError: error.message, nextAttemptAt: new Date(Date.now() + 15 * 60_000) } });
    }
  });
  return eventWorker;
}

async function closeEventWorker() {
  if (!eventWorker) return;
  await eventWorker.close();
  eventWorker = null;
}

module.exports = { closeEventWorker, failedPaymentEmailReady, sendEventEmail, startEventWorker };
