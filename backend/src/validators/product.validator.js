// validators/product.validators.js
const { body, param, query } = require("express-validator");
const mongoose = require("mongoose");
const Product = require("../models/Product");

const isValidObjectId = (v) => mongoose.Types.ObjectId.isValid(v);

// reusable option item rules
const optionItemRules = (path) => [
    body(`${path}`).optional().isArray().withMessage(`${path} must be an array`),

    body(`${path}.*.value`)
        .exists()
        .withMessage("value is required")
        .bail()
        .isString()
        .trim()
        .notEmpty(),

    body(`${path}.*.label`)
        .exists()
        .withMessage("label is required")
        .bail()
        .isString()
        .trim()
        .notEmpty(),

    body(`${path}.*.priceDelta`)
        .optional()
        .isFloat({ min: 0 })
        .withMessage("priceDelta must be >= 0"),

    body(`${path}.*.priceOverride`)
        .optional({ nullable: true })
        .custom((v) => v === null || (typeof v === "number" && v >= 0))
        .withMessage("priceOverride must be null or a number >= 0"),

    body(`${path}.*.images`).optional().isArray(),
    body(`${path}.*.images.*`).optional().isString().trim().notEmpty(),

    body(`${path}.*.isActive`).optional().isBoolean(),
];

// ---- CREATE ----
const createProductValidator = [
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

    body("images").isArray({ min: 1 }).withMessage("images must be a non-empty array"),
    body("images.*").isString().trim().notEmpty(),

    body("category")
        .custom((v) => isValidObjectId(v))
        .withMessage("category must be a valid ObjectId"),

    body("subcategories").optional().isArray(),
    body("subcategories.*")
        .optional()
        .custom((v) => isValidObjectId(v))
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

// ---- UPDATE ----
const updateProductValidator = [
    param("id")
        .custom((v) => isValidObjectId(v))
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

    body("category").optional().custom((v) => isValidObjectId(v)),
    body("subcategories").optional().isArray(),
    body("subcategories.*").optional().custom((v) => isValidObjectId(v)),

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

// ---- GET BY SLUG ----
const getBySlugValidator = [
    param("slug").isString().trim().toLowerCase().notEmpty(),
];

// ---- LIST ----
const listProductsValidator = [
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),

    query("category").optional().custom((v) => isValidObjectId(v)),
    query("subcategory").optional().custom((v) => isValidObjectId(v)),

    query("minPrice").optional().isFloat({ min: 0 }).toFloat(),
    query("maxPrice").optional().isFloat({ min: 0 }).toFloat(),

    query("inStock").optional().isBoolean().toBoolean(),
    query("isActive").optional().isBoolean().toBoolean(),

    query("q").optional().isString().trim(),
    query("sort").optional().isIn(["newest", "price_asc", "price_desc", "rating"]),
];

// ---- DELETE (SOFT) ----
const deleteProductValidator = [
    param("id").custom((v) => isValidObjectId(v)).withMessage("invalid product id"),
];

module.exports = {
    createProductValidator,
    updateProductValidator,
    getBySlugValidator,
    listProductsValidator,
    deleteProductValidator,
};