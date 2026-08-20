const { body } = require("express-validator");
const mongoose = require("mongoose");

exports.replaceCartValidator = [
  body("items").isArray({ max: 20 }).withMessage("Cart must contain at most 20 items."),
  body("items.*.productId").custom((id) => mongoose.Types.ObjectId.isValid(id)).withMessage("Invalid product."),
  body("items.*.quantity").isInt({ min: 1, max: 20 }).toInt().withMessage("Invalid quantity."),
  body("items.*.selectedOptions").optional().isArray({ max: 12 }).withMessage("Invalid selected options."),
  body("items.*.selectedOptions.*.key").optional().isString().trim().isLength({ min: 1, max: 40 }),
  body("items.*.selectedOptions.*.label").optional().isString().trim().isLength({ min: 1, max: 80 }),
  body("items.*.selectedOptions.*.value").optional().isString().trim().isLength({ min: 1, max: 120 }),
  body().custom((_, { req }) => {
    const unknown = Object.keys(req.body || {}).filter((key) => key !== "items");
    if (unknown.length) throw new Error(`Unknown fields: ${unknown.join(", ")}`);
    return true;
  }),
];
