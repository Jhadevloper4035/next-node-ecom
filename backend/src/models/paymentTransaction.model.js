const mongoose = require("mongoose");

const paymentTransactionSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
  attemptNumber: { type: Number, min: 1 },
  gateway: { type: String, enum: ["cashfree"], required: true },
  cfOrderId: { type: String, required: true },
  paymentSessionId: { type: String, required: true },
  cfPaymentId: { type: String, unique: true, sparse: true },
  amountPaise: { type: Number, required: true, min: 0 },
  currency: { type: String, default: "INR" },
  status: { type: String, enum: ["created", "pending", "paid", "failed", "user_dropped", "cancelled", "review_required", "refund_pending", "partially_refunded", "refunded"], default: "created" },
  cashfreeStatus: { type: String, default: "" },
  rawWebhookPayload: { type: String, default: "", select: false },
  pendingSince: { type: Date, default: null },
  processedAt: { type: Date, default: null },
}, { timestamps: true });

paymentTransactionSchema.index({ order: 1, attemptNumber: 1 }, { unique: true });
paymentTransactionSchema.index({ order: 1, createdAt: -1 });

module.exports = mongoose.model("PaymentTransaction", paymentTransactionSchema);
