const mongoose = require("mongoose");

const paymentGatewayCallSchema = new mongoose.Schema({
  operation: { type: String, enum: ["create_order", "get_order", "get_payments", "create_refund", "get_refunds"], required: true },
  success: { type: Boolean, required: true },
  statusCode: { type: Number, default: 0, min: 0 },
  durationMs: { type: Number, required: true, min: 0 },
  error: { type: String, default: "", maxlength: 250 },
}, { timestamps: true });

paymentGatewayCallSchema.index({ operation: 1, success: 1, createdAt: -1 });

module.exports = mongoose.model("PaymentGatewayCall", paymentGatewayCallSchema);
