const mongoose = require("mongoose");

const userUsageSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  reservedUses: { type: Number, default: 0, min: 0 },
  usedUses: { type: Number, default: 0, min: 0 },
}, { _id: false });

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, trim: true, uppercase: true, match: /^[A-Z0-9_-]{3,30}$/ },
  title: { type: String, required: true, trim: true, maxlength: 80 },
  description: { type: String, required: true, trim: true, maxlength: 240 },
  discountPercent: { type: Number, required: true, min: 1, max: 99 },
  isActive: { type: Boolean, default: true },
  usageLimit: { type: Number, default: null, min: 1 },
  perUserLimit: { type: Number, default: null, min: 1 },
  minOrderPaise: { type: Number, default: 0, min: 0 },
  maxDiscountPaise: { type: Number, default: null, min: 1 },
  allowedProductIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  allowedCategoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
  startsAt: { type: Date, default: null },
  expiresAt: { type: Date, default: null },
  reservedUses: { type: Number, default: 0, min: 0 },
  usedUses: { type: Number, default: 0, min: 0 },
  usageByUser: { type: [userUsageSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model("Coupon", couponSchema);
