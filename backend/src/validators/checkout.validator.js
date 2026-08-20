const { body, param } = require("express-validator");
const mongoose = require("mongoose");

const itemRules = [
  body("items").isArray({ min: 1, max: 20 }),
  body("items.*.productId").custom((id) => mongoose.Types.ObjectId.isValid(id)).withMessage("Invalid product"),
  body("items.*.quantity").isInt({ min: 1, max: 20 }).toInt(),
  body("items.*.selectedOptions").optional().isArray({ max: 12 }),
  body("items.*.selectedOptions.*.key").optional().isString().trim().isLength({ min: 1, max: 40 }),
  body("items.*.selectedOptions.*.value").optional().isString().trim().isLength({ min: 1, max: 120 }),
];

exports.createCheckoutValidator = [
  ...itemRules,
  body("addressId").custom((id) => mongoose.Types.ObjectId.isValid(id)).withMessage("Invalid address"),
  body("paymentMethod").isIn(["upi", "card", "cod"]).withMessage("Invalid payment method"),
  body("couponCode").optional().isString().trim().isLength({ min: 3, max: 30 }).matches(/^[A-Za-z0-9_-]+$/).withMessage("Invalid coupon code"),
  body("idempotencyKey").isUUID().withMessage("Invalid checkout request"),
  body().custom((_, { req }) => {
    const allowed = new Set(["items", "addressId", "paymentMethod", "couponCode", "idempotencyKey"]);
    const unknown = Object.keys(req.body || {}).filter((key) => !allowed.has(key));
    if (unknown.length) throw new Error(`Unknown fields: ${unknown.join(", ")}`);
    return true;
  }),
];

exports.orderIdValidator = [param("orderId").isString().trim().isLength({ min: 6, max: 80 })];
exports.statusValidator = [
  ...exports.orderIdValidator,
  body("status").isIn(["processing", "shipped", "delivered", "cancelled", "refunded"]),
];
