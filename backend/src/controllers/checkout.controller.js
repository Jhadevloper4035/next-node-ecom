const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { cancelActiveCheckout, createCheckout, retryCheckout, findActiveCheckout } = require("../services/checkout.service");
const { env } = require("../config/env");

const checkoutData = (order) => {
  if (!order) return null;
  const data = order.toObject();
  const activePayment = order.activePaymentTransaction || order.paymentTransaction;
  data.paymentTransaction = { paymentSessionId: activePayment?.paymentSessionId, status: activePayment?.status };
  return data;
};

exports.createCheckout = asyncHandler(async (req, res) => {
  const order = await createCheckout({ user: req.userDoc, ...req.body });
  return res.status(201).json(new ApiResponse({ message: "Checkout created", data: { order: checkoutData(order), paymentMode: env.cashfreeEnvironment } }));
});

exports.retryCheckout = asyncHandler(async (req, res) => {
  const order = await retryCheckout({ user: req.userDoc, orderNumber: req.params.orderId });
  return res.status(201).json(new ApiResponse({ message: "Payment retry created", data: { order: checkoutData(order), paymentMode: env.cashfreeEnvironment } }));
});

exports.cancelActiveCheckout = asyncHandler(async (req, res) => {
  const order = await cancelActiveCheckout({ user: req.userDoc, orderNumber: req.params.orderId });
  return res.json(new ApiResponse({ message: "Checkout cancelled", data: { order: checkoutData(order) } }));
});

exports.getActiveCheckout = asyncHandler(async (req, res) => {
  const order = await findActiveCheckout(req.user.id);
  return res.json(new ApiResponse({ data: { order: checkoutData(order), paymentMode: env.cashfreeEnvironment } }));
});
