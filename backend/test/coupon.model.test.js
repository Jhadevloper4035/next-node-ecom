const assert = require("node:assert/strict");
const test = require("node:test");
const Coupon = require("../src/models/coupon.model");

test("coupon requires a title and description", async () => {
  const coupon = new Coupon({
    code: "WELCOME10",
    title: "Welcome Offer",
    description: "Get 10% off your order.",
    discountPercent: 10,
  });

  await coupon.validate();
  await assert.rejects(
    new Coupon({ code: "MISSING", discountPercent: 10 }).validate(),
    (error) => Boolean(error.errors.title && error.errors.description),
  );
});
