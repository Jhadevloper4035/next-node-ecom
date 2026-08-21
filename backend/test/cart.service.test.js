process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";

const assert = require("node:assert/strict");
const test = require("node:test");
const User = require("../src/models/user.model");
const { itemKey, normalizeCartItems, removePurchasedCartItems } = require("../src/services/cart.service");

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

test("confirmed orders remove only their purchased cart variants", async () => {
  const originalFindById = User.findById;
  const user = {
    cartItems: [
      { product: "product-1", quantity: 1, selectedOptions: [{ key: "color", value: "Blue" }] },
      { product: "product-1", quantity: 1, selectedOptions: [{ key: "color", value: "Green" }] },
      { product: "product-2", quantity: 1, selectedOptions: [] },
    ],
    save: async () => {},
  };
  User.findById = async () => user;
  try {
    await removePurchasedCartItems("user-1", [{ product: "product-1", selectedOptions: [{ key: "color", value: "Blue" }] }]);
    assert.deepEqual(user.cartItems.map(itemKey), ["product-1__color:Green", "product-2"]);
  } finally {
    User.findById = originalFindById;
  }
});
