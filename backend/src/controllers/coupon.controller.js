const Coupon = require("../models/coupon.model");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

const availableCoupon = (code) => Coupon.findOne({
  code: code.toUpperCase(),
  isActive: true,
  $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
});

exports.getCoupon = asyncHandler(async (req, res) => {
  const coupon = await availableCoupon(req.params.code);
  if (!coupon) throw new ApiError(404, "Coupon is invalid or expired");
  return res.json(new ApiResponse({ data: { coupon: { code: coupon.code, title: coupon.title, description: coupon.description, discountPercent: coupon.discountPercent } } }));
});

exports.createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(req.body);
  return res.status(201).json(new ApiResponse({ message: "Coupon created", data: { coupon } }));
});

exports.updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.couponId, req.body, { new: true, runValidators: true });
  if (!coupon) throw new ApiError(404, "Coupon not found");
  return res.json(new ApiResponse({ message: "Coupon updated", data: { coupon } }));
});
