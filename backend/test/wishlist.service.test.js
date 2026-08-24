const assert = require("node:assert/strict");
const test = require("node:test");
const Product = require("../src/models/product.model");
const { getWishlistItems } = require("../src/services/wishlist.service");

test("wishlist returns active products in the saved order", async () => {
  const originalFind = Product.find;
  Product.find = () => ({
    select() { return this; },
    lean: async () => [{
      _id: "product-1",
      title: "Sofa",
      slug: "sofa",
      basePrice: 25_000,
      images: ["sofa.jpg"],
      inStock: true,
    }],
  });

  try {
    const items = await getWishlistItems({ wishlistItems: ["product-1", "missing"] });
    assert.deepEqual(items, [{
      id: "product-1",
      title: "Sofa",
      slug: "sofa",
      price: 25_000,
      imgSrc: "sofa.jpg",
      imgHover: "sofa.jpg",
      inStock: true,
    }]);
  } finally {
    Product.find = originalFind;
  }
});
