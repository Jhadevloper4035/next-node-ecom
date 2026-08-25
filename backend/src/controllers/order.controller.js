const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const Order = require("../models/order.model");
const EmailEvent = require("../models/emailEvent.model");
const { reconcileActiveCheckout, releasePendingCheckout, transitions } = require("../services/checkout.service");
const { enqueueDurableEmail } = require("../services/email-event.service");
const { initiateRefund } = require("../services/refund.service");
const { recordFinancialAudit } = require("../services/financial-audit.service");
const { recordOutboxEvent } = require("../services/outbox.service");
const logger = require("../config/logger");

const paymentFields = "gateway status cfOrderId cfPaymentId amountPaise currency paymentSessionId";
const refundData = (refund) => ({
  refundId: refund.refundId,
  amountPaise: refund.amountPaise,
  reason: refund.reason,
  status: refund.status,
  cashfreeStatus: refund.cashfreeStatus,
  cfRefundId: refund.cfRefundId,
  createdAt: refund.createdAt,
  updatedAt: refund.updatedAt,
});
const findOrder = (orderId, userId) => Order.findOne({ orderNumber: orderId, user: userId }).populate([
  { path: "activePaymentTransaction", select: paymentFields },
  { path: "paymentTransaction", select: paymentFields },
]);

exports.listMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(50).populate([
    { path: "activePaymentTransaction", select: paymentFields },
    { path: "paymentTransaction", select: paymentFields },
  ]);
  return res.json(new ApiResponse({ data: { orders } }));
});

exports.getMyOrder = asyncHandler(async (req, res) => {
  let order = await findOrder(req.params.orderId, req.user.id);
  if (!order) throw new ApiError(404, "Order not found");

  if (order.status === "pending_payment") {
    try {
      const result = await reconcileActiveCheckout(order, req.userDoc);
      if (result.order) order = result.order;
    } catch (error) {
      (req.log || logger).error({ err: error, event: "cashfree_payment_check_failed", orderNumber: order.orderNumber }, "Cashfree payment check failed");
    }
  }

  return res.json(new ApiResponse({ data: { order } }));
});

exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderNumber: req.params.orderId });
  if (!order) throw new ApiError(404, "Order not found");
  const previousStatus = order.status;
  const { codBalanceAction } = req.body;
  if (codBalanceAction) {
    const codBalanceDuePaise = order.codBalanceDuePaise || order.pricing?.balanceDuePaise || 0;
    if (order.paymentMethod !== "cod" || order.paymentStatus !== "advance_paid" || order.codBalanceStatus !== "due" || !codBalanceDuePaise) throw new ApiError(409, "COD balance is not due");
    const collection = codBalanceAction === "collected";
    if ((collection && (order.status !== "shipped" || req.body.status !== "delivered")) || (!collection && (!["processing", "shipped"].includes(order.status) || req.body.status !== "cancelled"))) {
      throw new ApiError(400, "Invalid COD balance transition");
    }
    const updatedOrder = await Order.findOneAndUpdate(
      { _id: order._id, status: order.status, paymentStatus: "advance_paid", codBalanceStatus: "due" },
      { $set: {
        status: req.body.status,
        paymentStatus: collection ? "paid" : "advance_paid",
        codBalanceStatus: codBalanceAction,
        codBalanceConfirmedBy: req.user.id,
        ...(collection ? { codBalanceCollectedAt: new Date() } : { codBalanceResolvedAt: new Date() }),
      } },
      { new: true },
    );
    if (!updatedOrder) throw new ApiError(409, "COD balance status has changed");
    await recordFinancialAudit({
      actor: req.user.id,
      actorType: "admin",
      order: updatedOrder._id,
      action: `cod_balance_${codBalanceAction}`,
      previousState: { status: previousStatus, paymentStatus: order.paymentStatus, codBalanceStatus: order.codBalanceStatus },
      newState: { status: updatedOrder.status, paymentStatus: updatedOrder.paymentStatus, codBalanceStatus: updatedOrder.codBalanceStatus },
      details: { codBalanceAction },
    });
    return res.json(new ApiResponse({ message: "COD balance updated", data: { order: updatedOrder } }));
  }
  const requestedStatus = req.body.status;
  const nextStatus = requestedStatus === "cancelled" && ["confirmed", "processing"].includes(order.status)
    ? "cancel_requested"
    : requestedStatus;
  if (order.paymentMethod === "cod" && order.codBalanceStatus === "due" && nextStatus === "delivered") throw new ApiError(409, "Record the COD balance before delivery");
  if (!transitions[order.status]?.includes(nextStatus)) throw new ApiError(400, "Invalid order status transition");
  if (order.status === "pending_payment" && nextStatus === "cancelled") {
    const cancelledOrder = await releasePendingCheckout({ orderId: order._id, actor: req.user.id, actorType: "admin", correlationId: `ADMIN:${req.user.id}:${order._id}` });
    if (!cancelledOrder) throw new ApiError(409, "Order payment status has changed");
    return res.json(new ApiResponse({ message: "Order updated", data: { order: cancelledOrder } }));
  }
  const updatedOrder = await Order.findOneAndUpdate(
    { _id: order._id, status: previousStatus },
    { $set: { status: nextStatus } },
    { new: true },
  );
  if (!updatedOrder) throw new ApiError(409, "Order status has changed");
  if (nextStatus === "confirmed") {
    await recordOutboxEvent({
      type: "ORDER_CONFIRMED",
      order: updatedOrder._id,
      paymentTransaction: updatedOrder.paymentTransaction,
      dedupeKey: `ORDER_CONFIRMED:${updatedOrder._id}`,
    });
  }
  await recordFinancialAudit({ actor: req.user.id, actorType: "admin", order: updatedOrder._id, paymentTransaction: updatedOrder.paymentTransaction, action: "order_status_updated", previousState: { status: previousStatus, paymentStatus: order.paymentStatus }, newState: { status: nextStatus, paymentStatus: updatedOrder.paymentStatus }, correlationId: `ADMIN:${req.user.id}:${updatedOrder._id}` });
  return res.json(new ApiResponse({ message: nextStatus === "cancel_requested" ? "Cancellation requested" : "Order updated", data: { order: updatedOrder } }));
});

exports.createRefund = asyncHandler(async (req, res) => {
  const refund = await initiateRefund({
    orderNumber: req.params.orderId,
    amountPaise: Math.round(req.body.amount * 100),
    reason: req.body.reason,
    idempotencyKey: req.body.idempotencyKey,
    actor: req.user.id,
    actorType: "admin",
  });
  await recordFinancialAudit({ actor: req.user.id, actorType: "admin", order: refund.order, refund: refund._id, action: "refund_requested", previousState: {}, newState: { status: refund.status }, correlationId: req.body.idempotencyKey, details: { amountPaise: refund.amountPaise } });
  return res.status(refund.status === "review_required" ? 202 : 201).json(new ApiResponse({ message: "Refund request recorded", data: { refund: refundData(refund) } }));
});

exports.resendEmail = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderNumber: req.params.orderId });
  if (!order) throw new ApiError(404, "Order not found");
  const emailEvent = await EmailEvent.findOne({ _id: req.params.emailEventId, order: order._id });
  if (!emailEvent) throw new ApiError(404, "Email event not found");
  await enqueueDurableEmail(emailEvent, { manual: true });
  await recordFinancialAudit({ actor: req.user.id, actorType: "admin", order: order._id, action: "email_resent", correlationId: `EMAIL:${emailEvent._id}`, details: { emailEvent: emailEvent._id, type: emailEvent.type, reason: req.body.reason } });
  return res.status(202).json(new ApiResponse({ message: "Email resend queued", data: { emailEventId: emailEvent._id } }));
});
