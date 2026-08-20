const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { createCheckout, findActiveCheckout } = require("../services/checkout.service");
const { env } = require("../config/env");

const checkoutData = (order) => {
  if (!order) return null;
  const data = order.toObject();
  data.paymentTransaction = { paymentSessionId: order.paymentTransaction?.paymentSessionId };
  return data;
};

exports.createCheckout = asyncHandler(async (req, res) => {
  const order = await createCheckout({ user: req.userDoc, ...req.body });
  return res.status(201).json(new ApiResponse({ message: "Checkout created", data: { order: checkoutData(order), paymentMode: env.cashfreeEnvironment } }));
});

exports.getActiveCheckout = asyncHandler(async (req, res) => {
  const order = await findActiveCheckout(req.user.id);
  return res.json(new ApiResponse({ data: { order: checkoutData(order), paymentMode: env.cashfreeEnvironment } }));
});
