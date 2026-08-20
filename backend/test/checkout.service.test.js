process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret";

const assert = require("node:assert/strict");
const test = require("node:test");
const { paymentPlan, percentageDiscount, priceItem } = require("../src/services/checkout.service");

test("COD always collects a one-third advance and leaves the balance due", () => {
  assert.deepEqual(paymentPlan(10_001, "cod"), { advancePaise: 3_334, balanceDuePaise: 6_667, paymentMethods: "upi,cc,dc" });
  assert.deepEqual(paymentPlan(10_001, "upi"), { advancePaise: 10_001, balanceDuePaise: 0, paymentMethods: "upi" });
});

test("percentage coupons discount the server-calculated subtotal", () => {
  assert.equal(percentageDiscount(99_999, 10), 9_999);
  assert.equal(percentageDiscount(99_999, 20), 19_999);
});

test("checkout prices the option shown by the product page when legacy groups overlap", () => {
  const product = {
    basePrice: 100,
    optionPricing: {
      sizes: [{ value: "3-seater", label: "3 Seater", priceDelta: 20 }],
    },
    customizationGroups: [{
      key: "size",
      label: "Size",
      options: [{ value: "queen", label: "Queen", priceDelta: 0 }],
    }],
  };

  const priced = priceItem(product, [{ key: "size", value: "3-seater" }]);
  assert.equal(priced.unitPricePaise, 12_000);
  assert.equal(priced.selectedOptions[0].value, "3 Seater");
});

test("checkout requires active required options", () => {
  const product = {
    basePrice: 100,
    customizationGroups: [{ key: "size", label: "Size", isRequired: true, isActive: true, options: [{ value: "queen", label: "Queen", priceDelta: 0, isActive: true }, { value: "king", label: "King", priceDelta: 10, isActive: false }] }],
  };

  assert.throws(() => priceItem(product, []), /Select Size/);
  assert.throws(() => priceItem(product, [{ key: "size", value: "king" }]), /Invalid product option/);
  assert.equal(priceItem(product, [{ key: "size", value: "queen" }]).unitPricePaise, 10_000);
});
