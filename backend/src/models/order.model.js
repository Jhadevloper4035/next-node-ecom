const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  title: { type: String, required: true },
  image: { type: String, default: "" },
  unitPricePaise: { type: Number, required: true, min: 0 },
  selectedOptions: [{ key: String, label: String, value: String }],
  quantity: { type: Number, required: true, min: 1 },
}, { _id: false });

const addressSnapshotSchema = new mongoose.Schema({
  fullName: String, phone: String, alternatePhone: String, line1: String, line2: String,
  landmark: String, city: String, state: String, country: String, postalCode: String,
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
  status: { type: String, enum: ["pending_payment", "confirmed", "processing", "shipped", "delivered", "payment_failed", "cancelled", "refunded"], default: "pending_payment", index: true },
  paymentStatus: { type: String, enum: ["pending", "advance_paid", "paid", "failed", "refunded"], default: "pending" },
  paymentMethod: { type: String, enum: ["upi", "card", "cod"], required: true },
  paymentTransaction: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentTransaction", default: null },
  idempotencyKey: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: true },
}, { timestamps: true });

orderSchema.index({ user: 1, idempotencyKey: 1 }, { unique: true });

module.exports = mongoose.model("Order", orderSchema);
