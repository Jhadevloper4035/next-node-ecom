const mongoose = require("mongoose");
const Coupon = require("../models/coupon.model");
const Order = require("../models/order.model");
const ApiError = require("../utils/ApiError");

const id = (value) => mongoose.isValidObjectId(value) ? new mongoose.Types.ObjectId(value) : value;
const sameId = (left, right) => String(left) === String(right);

function activeCouponFilter(now = new Date()) {
  return {
    isActive: true,
    $and: [
      { $or: [{ startsAt: null }, { startsAt: { $lte: now } }] },
      { $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] },
    ],
  };
}

function eligibleCouponItems(coupon, items) {
  const allowedProductIds = coupon.allowedProductIds || [];
  const allowedCategoryIds = coupon.allowedCategoryIds || [];
  const restricted = allowedProductIds.length || allowedCategoryIds.length;
  return restricted
    ? items.filter((item) => allowedProductIds.some((productId) => sameId(productId, item.product)) || allowedCategoryIds.some((categoryId) => sameId(categoryId, item.category)))
    : items;
}

function eligibleCouponSubtotal(coupon, items) {
  const eligibleItems = eligibleCouponItems(coupon, items);
  const subtotalPaise = eligibleItems.reduce((sum, item) => sum + item.unitPricePaise * item.quantity, 0);
  if (!subtotalPaise) throw new ApiError(400, "Coupon does not apply to these products");
  return subtotalPaise;
}

function validateCoupon(coupon, items, subtotalPaise) {
  const eligibleSubtotalPaise = eligibleCouponSubtotal(coupon, items);
  if (subtotalPaise < (coupon.minOrderPaise || 0)) throw new ApiError(400, "Coupon minimum order requirement is not met");
  return eligibleSubtotalPaise;
}

function reserveCouponUpdate(userId) {
  return [{ $set: {
    reservedUses: { $add: [{ $ifNull: ["$reservedUses", 0] }, 1] },
    usageByUser: {
      $let: {
        vars: { entries: { $ifNull: ["$usageByUser", []] } },
        in: {
          $cond: [
            { $gt: [{ $size: { $filter: { input: "$$entries", as: "entry", cond: { $eq: ["$$entry.user", userId] } } } }, 0] },
            { $map: { input: "$$entries", as: "entry", in: { $cond: [{ $eq: ["$$entry.user", userId] }, { $mergeObjects: ["$$entry", { reservedUses: { $add: [{ $ifNull: ["$$entry.reservedUses", 0] }, 1] } }] }, "$$entry"] } } },
            { $concatArrays: ["$$entries", [{ user: userId, reservedUses: 1, usedUses: 0 }]] },
          ],
        },
      },
    },
  } }];
}

async function reserveCoupon(coupon, userId, session) {
  const user = id(userId);
  const reserved = await Coupon.findOneAndUpdate(
    {
      _id: coupon._id,
      ...activeCouponFilter(),
      $expr: {
        $and: [
          { $or: [{ $eq: ["$usageLimit", null] }, { $lt: [{ $add: [{ $ifNull: ["$reservedUses", 0] }, { $ifNull: ["$usedUses", 0] }] }, "$usageLimit"] }] },
          { $or: [{ $eq: ["$perUserLimit", null] }, { $lt: [{ $sum: { $map: { input: { $filter: { input: { $ifNull: ["$usageByUser", []] }, as: "entry", cond: { $eq: ["$$entry.user", user] } } }, as: "entry", in: { $add: [{ $ifNull: ["$$entry.reservedUses", 0] }, { $ifNull: ["$$entry.usedUses", 0] }] } } } }, "$perUserLimit"] }] },
        ],
      },
    },
    reserveCouponUpdate(user),
    { new: true, ...(session && { session }) },
  );
  if (!reserved) throw new ApiError(409, "Coupon usage limit has been reached");
  return reserved;
}

async function releaseCouponUse(couponId, userId, session) {
  return Coupon.updateOne(
    { _id: couponId, "usageByUser.user": id(userId) },
    { $inc: { reservedUses: -1, "usageByUser.$.reservedUses": -1 } },
    { ...(session && { session }) },
  );
}

async function releaseCouponReservation(order, session) {
  if (!order?.coupon) return false;
  const reservedOrder = await Order.findOneAndUpdate(
    { _id: order._id, couponReservationStatus: "reserved" },
    { $set: { couponReservationStatus: "released" } },
    { ...(session && { session }) },
  );
  if (!reservedOrder) return false;
  await releaseCouponUse(order.coupon, order.user, session);
  order.couponReservationStatus = "released";
  return true;
}

async function consumeCouponReservation(order, session) {
  if (!order?.coupon) return false;
  const reservedOrder = await Order.findOneAndUpdate(
    { _id: order._id, couponReservationStatus: { $in: ["reserved", "released"] } },
    { $set: { couponReservationStatus: "consumed" } },
    { ...(session && { session }) },
  );
  if (!reservedOrder) return false;
  const wasReserved = reservedOrder.couponReservationStatus === "reserved";
  await Coupon.updateOne(
    { _id: order.coupon, "usageByUser.user": id(order.user) },
    { $inc: { usedUses: 1, "usageByUser.$.usedUses": 1, ...(wasReserved && { reservedUses: -1, "usageByUser.$.reservedUses": -1 }) } },
    { ...(session && { session }) },
  );
  order.couponReservationStatus = "consumed";
  return true;
}

async function reserveCouponForOrder(order, session) {
  if (!order?.coupon || order.couponReservationStatus !== "released") return false;
  const coupon = await Coupon.findById(order.coupon).lean();
  if (!coupon) throw new ApiError(400, "Coupon is no longer available");
  await reserveCoupon(coupon, order.user, session);
  const updatedOrder = await Order.findOneAndUpdate(
    { _id: order._id, couponReservationStatus: "released" },
    { $set: { couponReservationStatus: "reserved" } },
    { ...(session && { session }) },
  );
  if (updatedOrder) return true;
  await releaseCouponUse(coupon._id, order.user, session);
  return false;
}

module.exports = { activeCouponFilter, consumeCouponReservation, eligibleCouponItems, eligibleCouponSubtotal, releaseCouponReservation, releaseCouponUse, reserveCoupon, reserveCouponForOrder, validateCoupon };
