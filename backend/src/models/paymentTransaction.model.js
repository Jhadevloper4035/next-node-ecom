const mongoose = require("mongoose");

const paymentTransactionSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, unique: true },
  gateway: { type: String, enum: ["cashfree"], required: true },
  cfOrderId: { type: String, required: true, unique: true },
  paymentSessionId: { type: String, required: true },
  cfPaymentId: { type: String, unique: true, sparse: true },
  amountPaise: { type: Number, required: true, min: 0 },
  currency: { type: String, default: "INR" },
  status: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
  rawWebhookPayload: { type: String, default: "" },
  processedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model("PaymentTransaction", paymentTransactionSchema);
