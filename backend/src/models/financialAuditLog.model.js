const mongoose = require("mongoose");

const financialAuditLogSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  actorType: { type: String, enum: ["admin", "customer", "cashfree_webhook", "system_reconciliation", "system"], required: true, index: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
  paymentTransaction: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentTransaction", default: null, index: true },
  refund: { type: mongoose.Schema.Types.ObjectId, ref: "Refund", default: null },
  action: { type: String, required: true },
  previousState: { type: mongoose.Schema.Types.Mixed, default: {} },
  newState: { type: mongoose.Schema.Types.Mixed, default: {} },
  correlationId: { type: String, default: "", index: true },
  paymentId: { type: String, default: "", index: true },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

financialAuditLogSchema.index({ order: 1, createdAt: -1 });

module.exports = mongoose.model("FinancialAuditLog", financialAuditLogSchema);
