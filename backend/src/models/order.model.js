const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
  title: { type: String, required: true },
  image: { type: String, default: "" },
  unitPricePaise: { type: Number, required: true, min: 0 },
  gstPercent: { type: Number, required: true, min: 0, max: 100 },
  selectedOptions: [{ key: String, label: String, value: String }],
  quantity: { type: Number, required: true, min: 1 },
}, { _id: false });

const addressSnapshotSchema = new mongoose.Schema({
  fullName: String, phone: String, alternatePhone: String, line1: String, line2: String,
  landmark: String, city: String, state: String, country: String, postalCode: String,
}, { _id: false });

const checkoutIntentSchema = new mongoose.Schema({
  cartFingerprint: { type: String, default: "" },
  address: { type: mongoose.Schema.Types.ObjectId, ref: "Address", default: null },
  paymentMethod: { type: String, default: "" },
  couponCode: { type: String, default: "" },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  orderNumber: { type: String, required: true, unique: true, index: true },
  items: { type: [itemSchema], required: true, validate: (items) => items.length > 0 },
  addressSnapshot: { type: addressSnapshotSchema, required: true },
  pricing: {
    subtotalPaise: { type: Number, required: true, min: 0 }, discountPaise: { type: Number, default: 0, min: 0 },
    shippingPaise: { type: Number, default: 0, min: 0 }, taxPaise: { type: Number, default: 0, min: 0 },
    totalPaise: { type: Number, required: true, min: 0 }, advancePaise: { type: Number, default: 0, min: 0 }, balanceDuePaise: { type: Number, default: 0, min: 0 }, currency: { type: String, default: "INR" },
  },
  status: { type: String, enum: ["pending_payment", "confirmed", "processing", "shipped", "delivered", "payment_failed", "cancel_requested", "cancelled", "payment_review_required", "payment_received_after_cancellation", "refund_pending", "partially_refunded", "refunded"], default: "pending_payment", index: true },
  paymentStatus: { type: String, enum: ["pending", "advance_paid", "paid", "failed", "refund_pending", "partially_refunded", "refunded"], default: "pending" },
  paymentMethod: { type: String, enum: ["upi", "card", "cod"], required: true },
  advancePaidPaise: { type: Number, default: 0, min: 0 },
  advancePaidAt: { type: Date, default: null },
  advancePaymentTransaction: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentTransaction", default: null },
  codBalanceDuePaise: { type: Number, default: 0, min: 0 },
  codBalanceStatus: { type: String, enum: ["not_due", "due", "collected", "refused", "failed_delivery"], default: "not_due" },
  codBalanceCollectedAt: { type: Date, default: null },
  codBalanceResolvedAt: { type: Date, default: null },
  codBalanceConfirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  couponCode: { type: String, default: "" },
  coupon: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon", default: null },
  couponReservationStatus: { type: String, enum: ["none", "reserved", "consumed", "released"], default: "none" },
  checkoutIntent: { type: checkoutIntentSchema, default: () => ({}) },
  activePaymentTransaction: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentTransaction", default: null },
  paymentTransaction: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentTransaction", default: null },
  idempotencyKey: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: true },
  lastPaymentReconciledAt: { type: Date, default: null, index: true },
  refundReservedPaise: { type: Number, default: 0, min: 0 },
  refundedPaise: { type: Number, default: 0, min: 0 },
  appliedRefundIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
  releasedRefundIds: { type: [mongoose.Schema.Types.ObjectId], default: [] },
}, { timestamps: true });

orderSchema.index({ user: 1, idempotencyKey: 1 }, { unique: true });

module.exports = mongoose.model("Order", orderSchema);
