const Product = require("../models/product.model");
const User = require("../models/user.model");
const ApiError = require("../utils/ApiError");

const toWishlistItem = (product) => ({
  id: String(product._id),
  title: product.title,
  slug: product.slug,
  price: product.basePrice,
  imgSrc: product.images?.[0] || "/images/placeholder.svg",
  imgHover: product.images?.[1] || product.images?.[0] || "/images/placeholder.svg",
  inStock: product.inStock,
});

async function getWishlistItems(user) {
  const productIds = user.wishlistItems || [];
  const products = await Product.find({ _id: { $in: productIds }, isActive: true, isDeleted: false })
    .select("title slug basePrice images inStock")
    .lean();
  const productsById = new Map(products.map((product) => [String(product._id), product]));

  return productIds.flatMap((productId) => {
    const product = productsById.get(String(productId));
    return product ? [toWishlistItem(product)] : [];
  });
}

async function replaceWishlistItems(userId, productIds) {
  const uniqueIds = [...new Set(productIds.map(String))];
  const products = await Product.find({ _id: { $in: uniqueIds }, isActive: true, isDeleted: false })
    .select("_id")
    .lean();
  const availableIds = new Set(products.map((product) => String(product._id)));
  const wishlistItems = uniqueIds.filter((productId) => availableIds.has(productId));

  const user = await User.findByIdAndUpdate(
    userId,
    { wishlistItems },
    { new: true, runValidators: true },
  );
  if (!user) throw new ApiError(404, "User not found");

  return getWishlistItems(user);
}

module.exports = { getWishlistItems, replaceWishlistItems };
