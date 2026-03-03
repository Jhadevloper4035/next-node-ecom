const { body, param, query } = require("express-validator");
const mongoose = require("mongoose");
const Product = require("../models/product.model");

const isValidObjectId = (v) => mongoose.Types.ObjectId.isValid(v);

// ================= COMMON OPTION RULES =================

const optionItemRules = (path) => [
  body(path).optional().isArray().withMessage(`${path} must be an array`),

  body(`${path}.*.value`)
    .if(body(path).exists())
    .exists().withMessage("value is required")
    .bail()
    .isString()
    .trim()
    .notEmpty(),

  body(`${path}.*.label`)
    .if(body(path).exists())
    .exists().withMessage("label is required")
    .bail()
    .isString()
    .trim()
    .notEmpty(),

  body(`${path}.*.priceDelta`)
    .if(body(path).exists())
    .optional()
    .isFloat({ min: 0 })
    .withMessage("priceDelta must be >= 0"),

  body(`${path}.*.priceOverride`)
    .if(body(path).exists())
    .optional({ nullable: true })
    .custom((v) => v === null || (typeof v === "number" && v >= 0))
    .withMessage("priceOverride must be null or a number >= 0"),

  body(`${path}.*.images`)
    .if(body(path).exists())
    .optional()
    .isArray(),

  body(`${path}.*.images.*`)
    .if(body(path).exists())
    .optional()
    .isString()
    .trim()
    .notEmpty(),

  body(`${path}.*.isActive`)
    .if(body(path).exists())
    .optional()
    .isBoolean(),
];

// ================= CREATE =================

exports.createProductValidator = [
  body("title").isString().trim().isLength({ min: 3, max: 200 }),

  body("slug")
    .isString()
    .trim()
    .toLowerCase()
    .isLength({ min: 3, max: 200 })
    .custom(async (slug) => {
      const exists = await Product.findOne({ slug });
      if (exists) throw new Error("Slug already exists");
      return true;
    }),

  body("description").isString().trim().isLength({ min: 10, max: 2000 }),

  body("basePrice").isFloat({ min: 0 }),
  body("currency").optional().isIn(["INR", "USD", "EUR", "GBP"]),
  body("stock").optional().isInt({ min: 0 }),

  body("images")
    .isArray({ min: 1 })
    .withMessage("images must be a non-empty array"),
  body("images.*").isString().trim().notEmpty(),

  body("category")
    .custom(isValidObjectId)
    .withMessage("category must be a valid ObjectId"),

  body("subcategories").optional().isArray(),
  body("subcategories.*")
    .optional()
    .custom(isValidObjectId)
    .withMessage("each subcategory must be a valid ObjectId"),

  body("optionPricing").optional().isObject(),
  ...optionItemRules("optionPricing.sizes"),
  ...optionItemRules("optionPricing.fabrics"),
  ...optionItemRules("optionPricing.foams"),
  ...optionItemRules("optionPricing.materials"),

  body("dimensions").optional().isObject(),
  body("dimensions.length").optional().isFloat({ min: 0 }),
  body("dimensions.width").optional().isFloat({ min: 0 }),
  body("dimensions.height").optional().isFloat({ min: 0 }),
  body("dimensions.unit").optional().isIn(["cm", "inch", "m"]),

  body("weight").optional().isObject(),
  body("weight.value").optional().isFloat({ min: 0 }),
  body("weight.unit").optional().isIn(["kg", "g", "lb"]),

  body("assemblyRequired").optional().isBoolean(),
  body("warranty").optional().isString().trim(),

  body("careInstructions").optional().isArray(),
  body("careInstructions.*").optional().isString(),

  body("tags").optional().isArray(),
  body("tags.*").optional().isString(),

  body("isActive").optional().isBoolean(),
];

// ================= UPDATE =================

exports.updateProductValidator = [
  param("id")
    .custom(isValidObjectId)
    .withMessage("invalid product id"),

  body("title").optional().isString().trim().isLength({ min: 3, max: 200 }),

  body("slug")
    .optional()
    .isString()
    .trim()
    .toLowerCase()
    .isLength({ min: 3, max: 200 })
    .custom(async (slug, { req }) => {
      const { id } = req.params;
      const exists = await Product.findOne({ slug, _id: { $ne: id } });
      if (exists) throw new Error("Slug already exists");
      return true;
    }),

  body("description").optional().isString().trim().isLength({ min: 10, max: 2000 }),

  body("basePrice").optional().isFloat({ min: 0 }),
  body("currency").optional().isIn(["INR", "USD", "EUR", "GBP"]),
  body("stock").optional().isInt({ min: 0 }),

  body("images").optional().isArray({ min: 1 }),
  body("images.*").optional().isString().trim().notEmpty(),

  body("category").optional().custom(isValidObjectId),
  body("subcategories").optional().isArray(),
  body("subcategories.*").optional().custom(isValidObjectId),

  body("optionPricing").optional().isObject(),
  ...optionItemRules("optionPricing.sizes"),
  ...optionItemRules("optionPricing.fabrics"),
  ...optionItemRules("optionPricing.foams"),
  ...optionItemRules("optionPricing.materials"),

  body("dimensions").optional().isObject(),
  body("dimensions.length").optional().isFloat({ min: 0 }),
  body("dimensions.width").optional().isFloat({ min: 0 }),
  body("dimensions.height").optional().isFloat({ min: 0 }),
  body("dimensions.unit").optional().isIn(["cm", "inch", "m"]),

  body("weight").optional().isObject(),
  body("weight.value").optional().isFloat({ min: 0 }),
  body("weight.unit").optional().isIn(["kg", "g", "lb"]),

  body("assemblyRequired").optional().isBoolean(),
  body("warranty").optional().isString().trim(),

  body("careInstructions").optional().isArray(),
  body("careInstructions.*").optional().isString(),

  body("tags").optional().isArray(),
  body("tags.*").optional().isString(),

  body("isActive").optional().isBoolean(),
];

// ================= GET BY SLUG =================

exports.getBySlugValidator = [
  param("slug").isString().trim().toLowerCase().notEmpty(),
];

// ================= LIST =================

exports.listProductsValidator = [
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),

  query("category").optional().custom(isValidObjectId),
  query("subcategory").optional().custom(isValidObjectId),

  query("minPrice").optional().isFloat({ min: 0 }).toFloat(),
  query("maxPrice").optional().isFloat({ min: 0 }).toFloat(),

  query("inStock").optional().isBoolean().toBoolean(),
  query("isActive").optional().isBoolean().toBoolean(),

  query("q").optional().isString().trim(),
  query("sort").optional().isIn([
    "newest",
    "price_asc",
    "price_desc",
    "rating",
  ]),
];

// ================= DELETE =================

exports.deleteProductValidator = [
  param("id")
    .custom(isValidObjectId)
    .withMessage("invalid product id"),
];