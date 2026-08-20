const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const { getCartItems, replaceCartItems } = require("../services/cart.service");

exports.getCart = asyncHandler(async (req, res) => {
  const items = await getCartItems(req.userDoc);
  return res.json(new ApiResponse({ data: { items } }));
});

exports.replaceCart = asyncHandler(async (req, res) => {
  const items = await replaceCartItems(req.user.id, req.body.items);
  return res.json(new ApiResponse({ message: "Cart saved", data: { items } }));
});
