const mongoose = require("mongoose");

const outboxEventSchema = new mongoose.Schema({
  type: { type: String, enum: ["ORDER_RESERVED", "PAYMENT_SUCCESS", "PAYMENT_FAILED", "CHECKOUT_EXPIRED", "ORDER_CONFIRMED", "REFUND_INITIATED", "REFUND_COMPLETED", "REFUND_FAILED", "DUPLICATE_PAYMENT_RESOLVED"], required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
  paymentTransaction: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentTransaction", default: null },
  refund: { type: mongoose.Schema.Types.ObjectId, ref: "Refund", default: null },
  dedupeKey: { type: String, required: true, unique: true },
  status: { type: String, enum: ["pending", "queued", "delivered", "ignored", "failed"], default: "pending", index: true },
  publishAttempts: { type: Number, default: 0 },
  lastError: { type: String, default: "" },
  nextAttemptAt: { type: Date, default: Date.now, index: true },
  deliveredAt: { type: Date, default: null },
}, { timestamps: true });

module.exports = mongoose.model("OutboxEvent", outboxEventSchema);
