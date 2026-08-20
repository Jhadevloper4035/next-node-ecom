const { body, param } = require("express-validator");
const mongoose = require("mongoose");

const codeRule = (field) => field.isString().trim().toUpperCase().matches(/^[A-Z0-9_-]{3,30}$/).withMessage("Coupon code must use 3-30 letters, numbers, hyphens, or underscores.");
const textRule = (field, name, max) => field.isString().trim().notEmpty().isLength({ max }).withMessage(`${name} is required and must be at most ${max} characters.`);

exports.couponCodeValidator = [codeRule(param("code"))];
exports.createCouponValidator = [
  codeRule(body("code")),
  textRule(body("title"), "Title", 80),
  textRule(body("description"), "Description", 240),
  body("discountPercent").isInt({ min: 1, max: 99 }).toInt().withMessage("Discount must be between 1% and 99%."),
  body("isActive").optional().isBoolean().toBoolean(),
  body("expiresAt").optional({ nullable: true }).isISO8601().toDate(),
  body().custom((_, { req }) => {
    const allowed = new Set(["code", "title", "description", "discountPercent", "isActive", "expiresAt"]);
    const unknown = Object.keys(req.body || {}).filter((key) => !allowed.has(key));
    if (unknown.length) throw new Error(`Unknown fields: ${unknown.join(", ")}`);
    return true;
  }),
];
exports.updateCouponValidator = [
  param("couponId").custom((id) => mongoose.Types.ObjectId.isValid(id)).withMessage("Invalid coupon."),
  body("code").optional().customSanitizer((value) => String(value).trim().toUpperCase()).matches(/^[A-Z0-9_-]{3,30}$/).withMessage("Invalid coupon code."),
  textRule(body("title").optional(), "Title", 80),
  textRule(body("description").optional(), "Description", 240),
  body("discountPercent").optional().isInt({ min: 1, max: 99 }).toInt(),
  body("isActive").optional().isBoolean().toBoolean(),
  body("expiresAt").optional({ nullable: true }).isISO8601().toDate(),
  body().custom((_, { req }) => {
    const allowed = new Set(["code", "title", "description", "discountPercent", "isActive", "expiresAt"]);
    const unknown = Object.keys(req.body || {}).filter((key) => !allowed.has(key));
    if (unknown.length) throw new Error(`Unknown fields: ${unknown.join(", ")}`);
    return true;
  }),
];
