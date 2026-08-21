process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret";

const assert = require("node:assert/strict");
const test = require("node:test");
const Coupon = require("../src/models/coupon.model");
const Order = require("../src/models/order.model");
const { consumeCouponReservation, eligibleCouponSubtotal, reserveCoupon, validateCoupon } = require("../src/services/coupon-lifecycle.service");

const items = [
  { product: "product-a", category: "category-a", unitPricePaise: 10_000, quantity: 1 },
  { product: "product-b", category: "category-b", unitPricePaise: 5_000, quantity: 1 },
];

test("restricted coupons discount only eligible cart items", () => {
  const coupon = { allowedProductIds: ["product-a"], allowedCategoryIds: [], minOrderPaise: 12_000 };
  assert.equal(eligibleCouponSubtotal(coupon, items), 10_000);
  assert.equal(validateCoupon(coupon, items, 15_000), 10_000);
  assert.throws(() => validateCoupon(coupon, items, 10_000), /minimum order/);
});

test("limited coupon reservations use one atomic coupon update", async () => {
  const originalFindOneAndUpdate = Coupon.findOneAndUpdate;
  let call;
  Coupon.findOneAndUpdate = async (...args) => {
    call = args;
    return { _id: "coupon-id" };
  };
  try {
    await reserveCoupon({ _id: "coupon-id" }, "user-id");
    assert.equal(call[0]._id, "coupon-id");
    assert.ok(call[0].$expr);
    assert.ok(Array.isArray(call[1]));
    assert.equal(call[2].new, true);
  } finally {
    Coupon.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test("a successful payment consumes a coupon reservation once", async () => {
  const originalFindOneAndUpdate = Order.findOneAndUpdate;
  const originalUpdateOne = Coupon.updateOne;
  let transitions = 0;
  let couponUpdate;
  Order.findOneAndUpdate = async () => transitions++ ? null : { couponReservationStatus: "reserved" };
  Coupon.updateOne = async (_filter, update) => { couponUpdate = update; };
  try {
    const order = { _id: "order-id", coupon: "coupon-id", user: "user-id", couponReservationStatus: "reserved" };
    assert.equal(await consumeCouponReservation(order), true);
    assert.equal(await consumeCouponReservation(order), false);
    assert.equal(couponUpdate.$inc.usedUses, 1);
    assert.equal(couponUpdate.$inc.reservedUses, -1);
  } finally {
    Order.findOneAndUpdate = originalFindOneAndUpdate;
    Coupon.updateOne = originalUpdateOne;
  }
});
