const ApiResponse = require("../utils/ApiResponse");
const Order = require("../models/order.model");
const PaymentTransaction = require("../models/paymentTransaction.model");
const { releaseStock } = require("../services/checkout.service");
const { verifyCashfreeWebhook } = require("../services/payment.service");
const { sendMail } = require("../config/mailer");
const { orderConfirmedEmailTemplate } = require("../utils/emailTemplates");
const { env } = require("../config/env");

const paymentData = (payload) => payload?.data?.payment || payload?.payment || {};
const orderData = (payload) => payload?.data?.order || payload?.order || {};

exports.cashfreeWebhook = async (req, res) => {
  const rawBody = req.body?.toString("utf8") || "";
  if (!verifyCashfreeWebhook({ signature: req.get("x-webhook-signature"), timestamp: req.get("x-webhook-timestamp"), rawBody })) return res.status(400).json({ success: false, message: "Invalid webhook signature" });

  let payload;
  try { payload = JSON.parse(rawBody); } catch { return res.status(400).json({ success: false, message: "Invalid webhook payload" }); }
  const orderNumber = orderData(payload).order_id;
  const payment = paymentData(payload);
  const paymentId = String(payment.cf_payment_id || "");
  const paidPaise = Math.round(Number(payment.payment_amount) * 100);
  const isSuccess = payment.payment_status === "SUCCESS" || payload.type === "PAYMENT_SUCCESS_WEBHOOK";
  const isFailure = payment.payment_status === "FAILED" || payload.type === "PAYMENT_FAILED_WEBHOOK";
  const order = await Order.findOne({ orderNumber }).populate("user");
  if (!order) return res.status(200).json(new ApiResponse({ message: "Webhook ignored" }));
  const transaction = await PaymentTransaction.findOne({ order: order._id });
  if (!transaction) return res.status(200).json(new ApiResponse({ message: "Webhook ignored" }));

  if (isSuccess && paidPaise !== order.pricing.totalPaise) return res.status(400).json({ success: false, message: "Payment amount mismatch" });

  if (isSuccess && order.status === "pending_payment") {
    transaction.status = "paid";
    transaction.cfPaymentId = paymentId || transaction.cfPaymentId;
    transaction.rawWebhookPayload = rawBody;
    transaction.processedAt = new Date();
    await transaction.save();
    order.status = "confirmed";
    order.paymentStatus = "paid";
    await order.save();
    if (order.user?.email) sendMail({ to: order.user.email, subject: `${env.appName} order confirmed`, html: orderConfirmedEmailTemplate({ order }) }).catch((error) => console.error("Order email failed:", error.message));
  } else if (isFailure && order.status === "pending_payment") {
    transaction.status = "failed";
    transaction.cfPaymentId = paymentId || transaction.cfPaymentId;
    transaction.rawWebhookPayload = rawBody;
    transaction.processedAt = new Date();
    await transaction.save();
    order.status = "payment_failed";
    order.paymentStatus = "failed";
    await order.save();
    await releaseStock(order.items);
  }
  return res.status(200).json(new ApiResponse({ message: "Webhook processed" }));
};
