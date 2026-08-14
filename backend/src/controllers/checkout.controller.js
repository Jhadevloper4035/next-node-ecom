const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { createCheckout } = require("../services/checkout.service");
const { env } = require("../config/env");

exports.createCheckout = asyncHandler(async (req, res) => {
  const order = await createCheckout({ user: req.userDoc, ...req.body });
  const data = order.toObject();
  data.paymentTransaction = { paymentSessionId: order.paymentTransaction?.paymentSessionId };
  return res.status(201).json(new ApiResponse({ message: "Checkout created", data: { order: data, paymentMode: env.cashfreeEnvironment } }));
});
