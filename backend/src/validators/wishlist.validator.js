const { body } = require("express-validator");
const mongoose = require("mongoose");

exports.replaceWishlistValidator = [
  body("productIds").isArray({ max: 100 }).withMessage("Wishlist must contain at most 100 items."),
  body("productIds.*").custom((id) => mongoose.Types.ObjectId.isValid(id)).withMessage("Invalid product."),
  body().custom((_, { req }) => {
    const unknown = Object.keys(req.body || {}).filter((key) => key !== "productIds");
    if (unknown.length) throw new Error(`Unknown fields: ${unknown.join(", ")}`);
    return true;
  }),
];
