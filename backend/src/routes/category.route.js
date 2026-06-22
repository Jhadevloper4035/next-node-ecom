const router = require("express").Router();
const ctrl = require("../controllers/category.controller.js");
const validator = require("../validators/category.validator.js");
const validate  = require("../validators/index.js")
const { env } = require("../config/env");
const cacheResponse = require("../middlewares/cacheResponse");

const categoryCache = (resource) => cacheResponse({
  namespace: "categories",
  resource,
  ttlSeconds: env.cacheCategoryTtlSeconds,
});

// category
router.post("/", validator.createCategory, validate , ctrl.createCategory);
router.get("/", validator.getCategories, validate, categoryCache("list"), ctrl.getCategories);

router.get("/tree", categoryCache("tree"), ctrl.getCategoryTree);
router.get("/stats", ctrl.getCategoryStats);

router.get("/slug/:slug", validator.getBySlug, validate, categoryCache("slug"), ctrl.getCategoryBySlug);
router.get("/:id", validator.getById, validate, categoryCache("id"), ctrl.getCategoryById);

router.put("/:id", validator.updateCategory, validate, ctrl.updateCategory);
router.delete("/:id", validator.deleteById, validate, ctrl.deleteCategory);

router.post("/:id/restore", validator.restoreById, validate, ctrl.restoreCategory);

router.patch("/bulk", ctrl.bulkUpdateCategories);
router.post("/bulk-delete", ctrl.bulkDeleteCategories);

// subcategory (nested)
router.post("/:parentId/subcategories", validator.createSubcategory, validate, ctrl.createSubcategory);
router.get("/:parentId/subcategories", validator.getSubcategories, validate, categoryCache("subcategories"), ctrl.getSubcategories);
router.put("/:parentId/subcategories/reorder", validator.reorderSubcategories, validate,  ctrl.reorderSubcategories);

module.exports = router;
