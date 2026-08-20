const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const Order = require("../models/order.model");
const { getCashfreeOrder } = require("../services/payment.service");
const { removePurchasedCartItems } = require("../services/cart.service");
const { sendMail } = require("../config/mailer");
const { orderConfirmedEmailTemplate } = require("../utils/emailTemplates");
const { env } = require("../config/env");
const { releaseStock, transitions } = require("../services/checkout.service");

const findOrder = (orderId, userId) => Order.findOne({ orderNumber: orderId, user: userId }).populate({ path: "paymentTransaction", select: "status cfPaymentId amountPaise currency" });

exports.listMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(50).populate({ path: "paymentTransaction", select: "status cfPaymentId amountPaise currency" });
  return res.json(new ApiResponse({ data: { orders } }));
});

exports.getMyOrder = asyncHandler(async (req, res) => {
  let order = await findOrder(req.params.orderId, req.user.id);
  if (!order) throw new ApiError(404, "Order not found");

  if (order.status === "pending_payment" && order.paymentTransaction) {
    try {
      const cashfreeOrder = await getCashfreeOrder(order.orderNumber);
      const paidPaise = Math.round(Number(cashfreeOrder.order_amount) * 100);
      if (cashfreeOrder.order_status === "PAID" && paidPaise === order.paymentTransaction.amountPaise) {
        const confirmedOrder = await Order.findOneAndUpdate(
          { _id: order._id, status: "pending_payment" },
          { $set: { status: "confirmed", paymentStatus: order.paymentMethod === "cod" ? "advance_paid" : "paid" } },
          { new: true },
        ).populate({ path: "paymentTransaction", select: "status cfPaymentId amountPaise currency" });
        if (!confirmedOrder) return res.json(new ApiResponse({ data: { order: await findOrder(req.params.orderId, req.user.id) } }));
        order.paymentTransaction.status = "paid";
        order.paymentTransaction.processedAt = new Date();
        await order.paymentTransaction.save();
        confirmedOrder.paymentTransaction.status = "paid";
        await removePurchasedCartItems(confirmedOrder.user, confirmedOrder.items);
        if (req.userDoc?.email) sendMail({ to: req.userDoc.email, subject: `${env.appName} order confirmed`, html: orderConfirmedEmailTemplate({ order: confirmedOrder }) }).catch((error) => console.error("Order email failed:", error.message));
        order = confirmedOrder;
      }
    } catch (error) {
      console.error("Cashfree payment check failed:", error.message);
    }
  }

  return res.json(new ApiResponse({ data: { order } }));
});

exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderNumber: req.params.orderId });
  if (!order) throw new ApiError(404, "Order not found");
  if (!transitions[order.status].includes(req.body.status)) throw new ApiError(400, "Invalid order status transition");
  if (order.status === "pending_payment" && req.body.status === "cancelled") {
    const cancelledOrder = await Order.findOneAndUpdate({ _id: order._id, status: "pending_payment" }, { $set: { status: "cancelled", paymentStatus: "failed" } }, { new: true });
    if (!cancelledOrder) throw new ApiError(409, "Order payment status has changed");
    await releaseStock(cancelledOrder.items);
    return res.json(new ApiResponse({ message: "Order updated", data: { order: cancelledOrder } }));
  }
  order.status = req.body.status;
  await order.save();
  return res.json(new ApiResponse({ message: "Order updated", data: { order } }));
});
