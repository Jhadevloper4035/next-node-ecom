const Product = require("../models/product.model");
const User = require("../models/user.model");
const ApiError = require("../utils/ApiError");

const itemKey = (item) => [item.productId || item.product, ...(item.selectedOptions || [])
  .map((option) => `${option.key}:${option.value}`)
  .sort()
].join("__");

function normalizeCartItems(items) {
  const cart = new Map();

  for (const item of items) {
    const key = itemKey(item);
    const existing = cart.get(key);
    const quantity = Number(item.quantity);

    if (existing) {
      existing.quantity = Math.min(existing.quantity + quantity, 20);
      continue;
    }

    cart.set(key, {
      product: item.productId || item.product,
      quantity,
      selectedOptions: (item.selectedOptions || []).map(({ key, label, value }) => ({ key, label, value })),
    });
  }

  return [...cart.values()];
}

async function getCartItems(user) {
  const productIds = user.cartItems.map((item) => item.product);
  const products = await Product.find({ _id: { $in: productIds }, isActive: true, isDeleted: false })
    .select("title slug basePrice gstPercent category images stock inStock")
    .lean();
  const productsById = new Map(products.map((product) => [String(product._id), product]));

  return user.cartItems.flatMap((item) => {
    const product = productsById.get(String(item.product));
    if (!product) return [];

    return [{
      id: itemKey(item),
      productId: String(product._id),
      title: product.title,
      slug: product.slug,
      price: product.basePrice,
      gstPercent: product.gstPercent,
      category: product.category,
      imgSrc: product.images?.[0] || "/images/placeholder.svg",
      inStock: product.inStock,
      quantity: item.quantity,
      selectedOptions: item.selectedOptions || [],
    }];
  });
}

async function replaceCartItems(userId, items) {
  const user = await User.findByIdAndUpdate(
    userId,
    { cartItems: normalizeCartItems(items) },
    { new: true, runValidators: true },
  );
  if (!user) throw new ApiError(404, "User not found");
  return getCartItems(user);
}

async function removePurchasedCartItems(userId, orderItems) {
  const purchased = new Set(orderItems.map((item) => itemKey(item)));
  const user = await User.findById(userId);
  if (!user) return;

  user.cartItems = user.cartItems.filter((item) => !purchased.has(itemKey(item)));
  await user.save();
}

module.exports = { getCartItems, itemKey, normalizeCartItems, removePurchasedCartItems, replaceCartItems };
