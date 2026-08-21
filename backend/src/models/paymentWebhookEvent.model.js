const mongoose = require("mongoose");

const paymentWebhookEventSchema = new mongoose.Schema({
  gateway: { type: String, enum: ["cashfree"], required: true },
  dedupeKey: { type: String, required: true },
  eventType: { type: String, default: "UNKNOWN" },
  cfPaymentId: { type: String, default: "" },
  orderId: { type: String, default: "" },
  cfOrderId: { type: String, default: "" },
  signatureValid: { type: Boolean, required: true },
  rawPayload: { type: String, required: true, select: false },
  receivedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ["processing", "processed", "ignored", "failed"], default: "processing" },
  processingStartedAt: { type: Date, default: Date.now },
  processedAt: { type: Date, default: null },
  processingError: { type: String, default: "" },
  duplicateCount: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

paymentWebhookEventSchema.index({ gateway: 1, dedupeKey: 1 }, { unique: true });
paymentWebhookEventSchema.index({ cfPaymentId: 1, eventType: 1 });

module.exports = mongoose.model("PaymentWebhookEvent", paymentWebhookEventSchema);
