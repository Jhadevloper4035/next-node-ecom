const { body, param } = require("express-validator");
const mongoose = require("mongoose");

const codeRule = (field) => field.isString().trim().toUpperCase().matches(/^[A-Z0-9_-]{3,30}$/).withMessage("Coupon code must use 3-30 letters, numbers, hyphens, or underscores.");
const textRule = (field, name, max) => field.isString().trim().notEmpty().isLength({ max }).withMessage(`${name} is required and must be at most ${max} characters.`);
const optionalPositiveInt = (field, name) => field.optional({ nullable: true }).isInt({ min: 1 }).toInt().withMessage(`${name} must be a positive integer.`);
const optionalPaise = (field, name, min) => field.optional({ nullable: true }).isInt({ min }).toInt().withMessage(`${name} must be an integer number of paise.`);
const idList = (field, name) => field.optional().isArray({ max: 100 }).withMessage(`${name} must be an array.`);
const idListItems = (field, name) => field.optional().custom((id) => mongoose.Types.ObjectId.isValid(id)).withMessage(`Invalid ${name}.`);
const couponFields = new Set(["code", "title", "description", "discountPercent", "isActive", "usageLimit", "perUserLimit", "minOrderPaise", "maxDiscountPaise", "allowedProductIds", "allowedCategoryIds", "startsAt", "expiresAt"]);

function rejectUnknownFields(_, { req }) {
  const unknown = Object.keys(req.body || {}).filter((key) => !couponFields.has(key));
  if (unknown.length) throw new Error(`Unknown fields: ${unknown.join(", ")}`);
  return true;
}

exports.couponCodeValidator = [codeRule(param("code"))];
exports.createCouponValidator = [
  codeRule(body("code")),
  textRule(body("title"), "Title", 80),
  textRule(body("description"), "Description", 240),
  body("discountPercent").isInt({ min: 1, max: 99 }).toInt().withMessage("Discount must be between 1% and 99%."),
  body("isActive").optional().isBoolean().toBoolean(),
  optionalPositiveInt(body("usageLimit"), "Usage limit"),
  optionalPositiveInt(body("perUserLimit"), "Per-user limit"),
  optionalPaise(body("minOrderPaise"), "Minimum order", 0),
  optionalPaise(body("maxDiscountPaise"), "Maximum discount", 1),
  idList(body("allowedProductIds"), "allowed products"),
  idListItems(body("allowedProductIds.*"), "allowed product"),
  idList(body("allowedCategoryIds"), "allowed categories"),
  idListItems(body("allowedCategoryIds.*"), "allowed category"),
  body("startsAt").optional({ nullable: true }).isISO8601().toDate(),
  body("expiresAt").optional({ nullable: true }).isISO8601().toDate(),
  body().custom(rejectUnknownFields),
];
exports.updateCouponValidator = [
  param("couponId").custom((id) => mongoose.Types.ObjectId.isValid(id)).withMessage("Invalid coupon."),
  body("code").optional().customSanitizer((value) => String(value).trim().toUpperCase()).matches(/^[A-Z0-9_-]{3,30}$/).withMessage("Invalid coupon code."),
  textRule(body("title").optional(), "Title", 80),
  textRule(body("description").optional(), "Description", 240),
  body("discountPercent").optional().isInt({ min: 1, max: 99 }).toInt(),
  body("isActive").optional().isBoolean().toBoolean(),
  optionalPositiveInt(body("usageLimit"), "Usage limit"),
  optionalPositiveInt(body("perUserLimit"), "Per-user limit"),
  optionalPaise(body("minOrderPaise"), "Minimum order", 0),
  optionalPaise(body("maxDiscountPaise"), "Maximum discount", 1),
  idList(body("allowedProductIds"), "allowed products"),
  idListItems(body("allowedProductIds.*"), "allowed product"),
  idList(body("allowedCategoryIds"), "allowed categories"),
  idListItems(body("allowedCategoryIds.*"), "allowed category"),
  body("startsAt").optional({ nullable: true }).isISO8601().toDate(),
  body("expiresAt").optional({ nullable: true }).isISO8601().toDate(),
  body().custom(rejectUnknownFields),
];
