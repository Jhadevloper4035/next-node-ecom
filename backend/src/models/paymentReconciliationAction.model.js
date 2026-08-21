const mongoose = require("mongoose");

const paymentReconciliationActionSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
  paymentTransaction: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentTransaction", default: null },
  cfPaymentId: { type: String, default: "" },
  type: { type: String, enum: ["confirmed", "late_payment", "duplicate_payment", "amount_mismatch", "currency_mismatch", "cashfree_order_mismatch", "missing_attempt", "pending_payment_review"], required: true },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  dedupeKey: { type: String, required: true, unique: true },
}, { timestamps: true });

module.exports = mongoose.model("PaymentReconciliationAction", paymentReconciliationActionSchema);
