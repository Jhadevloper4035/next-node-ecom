const { body, param, query } = require("express-validator");
const mongoose = require("mongoose");

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

exports.listProductReviewsValidator = [
  param("productId").custom(isValidObjectId).withMessage("invalid product id"),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 50 }).toInt(),
  query("sort").optional().isIn(["newest", "highest", "lowest"]),
];

exports.createProductReviewValidator = [
  param("productId").custom(isValidObjectId).withMessage("invalid product id"),
  body("title")
    .optional({ checkFalsy: true })
    .isString()
    .trim()
    .isLength({ max: 120 })
    .withMessage("review title is too long"),
  body("comment")
    .isString()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("review must be between 10 and 1000 characters"),
  body("rating")
    .isInt({ min: 1, max: 5 })
    .toInt()
    .withMessage("rating must be between 1 and 5"),
];
