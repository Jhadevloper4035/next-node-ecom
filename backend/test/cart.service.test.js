process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";

const assert = require("node:assert/strict");
const test = require("node:test");
const { itemKey, normalizeCartItems } = require("../src/services/cart.service");

test("cart items merge only when product and selected options match", () => {
  const items = normalizeCartItems([
    { productId: "507f1f77bcf86cd799439011", quantity: 1, selectedOptions: [{ key: "color", value: "Blue" }] },
    { productId: "507f1f77bcf86cd799439011", quantity: 2, selectedOptions: [{ key: "color", value: "Blue" }] },
    { productId: "507f1f77bcf86cd799439011", quantity: 1, selectedOptions: [{ key: "color", value: "Green" }] },
  ]);

  assert.equal(items.length, 2);
  assert.equal(items[0].quantity, 3);
  assert.equal(itemKey(items[0]), "507f1f77bcf86cd799439011__color:Blue");
});
