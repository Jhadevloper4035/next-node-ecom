const mongoose = require("mongoose");

const refundSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
  paymentTransaction: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentTransaction", required: true, index: true },
  refundId: { type: String, required: true, unique: true },
  idempotencyKey: { type: String, required: true },
  kind: { type: String, enum: ["customer_refund", "duplicate_payment_auto"], default: "customer_refund" },
  amountPaise: { type: Number, required: true, min: 1 },
  reason: { type: String, required: true, maxlength: 250 },
  previousOrderStatus: { type: String, required: true },
  previousPaymentStatus: { type: String, required: true },
  status: { type: String, enum: ["created", "pending", "success", "failed", "cancelled", "review_required"], default: "created", index: true },
  cashfreeStatus: { type: String, default: "" },
  cfRefundId: { type: String, default: null, sparse: true, unique: true },
  rawResponse: { type: String, default: "", select: false },
  appliedAt: { type: Date, default: null },
  reservationReleasedAt: { type: Date, default: null },
}, { timestamps: true });

refundSchema.index({ order: 1, idempotencyKey: 1 }, { unique: true });

module.exports = mongoose.model("Refund", refundSchema);
