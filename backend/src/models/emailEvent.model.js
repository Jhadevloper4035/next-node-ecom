const mongoose = require("mongoose");

const emailEventSchema = new mongoose.Schema({
  outboxEvent: { type: mongoose.Schema.Types.ObjectId, ref: "OutboxEvent", required: true, unique: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
  paymentTransaction: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentTransaction", default: null },
  refund: { type: mongoose.Schema.Types.ObjectId, ref: "Refund", default: null },
  type: { type: String, enum: ["orderReserved", "paymentFailed", "checkoutExpired", "orderConfirmed", "refundInitiated", "refundCompleted", "refundFailed", "duplicatePaymentResolvedSupport"], required: true },
  to: { type: String, required: true, lowercase: true, trim: true },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  dedupeKey: { type: String, required: true, unique: true },
  status: { type: String, enum: ["pending", "queued", "sending", "sent", "ignored", "failed"], default: "pending", index: true },
  attemptCount: { type: Number, default: 0, min: 0 },
  manualResendCount: { type: Number, default: 0, min: 0 },
  sentAt: { type: Date, default: null },
  lastAttemptAt: { type: Date, default: null, index: true },
  finalError: { type: String, default: "" },
}, { timestamps: true });

emailEventSchema.index({ order: 1, createdAt: -1 });

module.exports = mongoose.model("EmailEvent", emailEventSchema);
