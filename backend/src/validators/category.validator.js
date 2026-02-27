const { body, param, query } = require("express-validator");
const mongoose = require("mongoose");



const isObjectId = (v) => mongoose.Types.ObjectId.isValid(v);

const parentValidator = body("parent")
  .optional({ nullable: true })
  .custom((v) => {
    if (v === null || v === "" || v === "null") return true;
    return isObjectId(v);
  })
  .withMessage("Invalid parent id");


const createCategory = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("name must be 2-100 characters"),
  parentValidator,
  body("description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  body("isActive").optional().isBoolean().withMessage("isActive must be boolean"),
  body("displayOrder").optional().isInt({ min: 0 }).withMessage("displayOrder must be >= 0"),
  body("images").optional().isArray().withMessage("images must be an array"),
  body("images.*.url").optional().isString().withMessage("image url must be string"),
  body("images.*.isPrimary").optional().isBoolean().withMessage("isPrimary must be boolean")
]

const updateCategory = [
  param("id").custom(isObjectId).withMessage("Invalid category id"),
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("name cannot be empty")
    .isLength({ min: 2, max: 100 })
    .withMessage("name must be 2-100 characters"),
  parentValidator,
  body("description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  body("isActive").optional().isBoolean().withMessage("isActive must be boolean"),
  body("displayOrder").optional().isInt({ min: 0 }).withMessage("displayOrder must be >= 0"),
  body("slug").optional().custom(() => { throw new Error("slug cannot be updated directly"); })
]

const getCategories = [
  query("page").optional().isInt({ min: 1 }).withMessage("page must be >= 1"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be 1-100"),
  query("isActive").optional().isBoolean().withMessage("isActive must be boolean"),
  query("parent")
    .optional()
    .custom((v) => {
      if (v === "null" || v === "" || v === null) return true;
      return isObjectId(v);
    })
    .withMessage("Invalid parent id"),
]

const getById = [param("id").custom(isObjectId).withMessage("Invalid category id")]
const getBySlug = [param("slug").trim().notEmpty().withMessage("slug is required")]
const deleteById = [param("id").custom(isObjectId).withMessage("Invalid category id")]
const restoreById = [param("id").custom(isObjectId).withMessage("Invalid category id")]


const createSubcategory = [
  param("parentId").custom(isObjectId).withMessage("Invalid parent id"),
  body("name")
    .trim()
    .notEmpty()
    .withMessage("name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("name must be 2-100 characters")
]

const getSubcategories = [
  param("parentId").custom(isObjectId).withMessage("Invalid parent id"),
  query("page").optional().isInt({ min: 1 }).withMessage("page must be >= 1"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be 1-100")
]

const reorderSubcategories = [
  param("parentId").custom(isObjectId).withMessage("Invalid parent id"),
  body("orderData").isArray({ min: 1 }).withMessage("orderData must be a non-empty array"),
  body("orderData.*.id").custom(isObjectId).withMessage("Invalid subcategory id in orderData"),
  body("orderData.*.displayOrder")
    .optional()
    .isInt({ min: 0 })
    .withMessage("displayOrder must be >= 0")
]

const moveSubcategory = [
  param("subcategoryId").custom(isObjectId).withMessage("Invalid subcategory id"),
  body("newParentId")
    .notEmpty()
    .withMessage("newParentId is required")
    .custom(isObjectId)
    .withMessage("Invalid newParentId"),
]



module.exports = {
  createCategory,
  updateCategory,
  getCategories,
  getById,
  getBySlug,
  deleteById,
  restoreById,
  createSubcategory,
  getSubcategories,
  reorderSubcategories,
  moveSubcategory
}