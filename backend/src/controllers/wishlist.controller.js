const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { getWishlistItems, replaceWishlistItems } = require("../services/wishlist.service");

exports.getWishlist = asyncHandler(async (req, res) => {
  const items = await getWishlistItems(req.userDoc);
  return res.json(new ApiResponse({ data: { items } }));
});

exports.replaceWishlist = asyncHandler(async (req, res) => {
  const items = await replaceWishlistItems(req.user.id, req.body.productIds);
  return res.json(new ApiResponse({ message: "Wishlist saved", data: { items } }));
});
