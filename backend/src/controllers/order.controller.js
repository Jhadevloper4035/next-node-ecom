const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const Order = require("../models/order.model");
const { releaseStock, transitions } = require("../services/checkout.service");

const findOrder = (orderId, userId) => Order.findOne({ orderNumber: orderId, user: userId }).populate({ path: "paymentTransaction", select: "status cfPaymentId amountPaise currency" });

exports.listMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(50).populate({ path: "paymentTransaction", select: "status cfPaymentId amountPaise currency" });
  return res.json(new ApiResponse({ data: { orders } }));
});

exports.getMyOrder = asyncHandler(async (req, res) => {
  const order = await findOrder(req.params.orderId, req.user.id);
  if (!order) throw new ApiError(404, "Order not found");
  return res.json(new ApiResponse({ data: { order } }));
});

exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ orderNumber: req.params.orderId });
  if (!order) throw new ApiError(404, "Order not found");
  if (!transitions[order.status].includes(req.body.status)) throw new ApiError(400, "Invalid order status transition");
  if (order.status === "pending_payment" && req.body.status === "cancelled") await releaseStock(order.items);
  order.status = req.body.status;
  await order.save();
  return res.json(new ApiResponse({ message: "Order updated", data: { order } }));
});
