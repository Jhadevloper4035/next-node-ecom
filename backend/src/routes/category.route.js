const router = require("express").Router();
const ctrl = require("../controllers/category.controller.js");
const validator = require("../validators/category.validator.js");
const validate  = require("../validators/index.js")
const { env } = require("../config/env");
const cacheResponse = require("../middlewares/cacheResponse");
const auth = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");

const categoryCache = (resource) => cacheResponse({
  namespace: "categories",
  resource,
  ttlSeconds: env.cacheCategoryTtlSeconds,
});
const adminOnly = [auth, requireRole("admin")];

// category
router.post("/", ...adminOnly, validator.createCategory, validate , ctrl.createCategory);
router.get("/", validator.getCategories, validate, categoryCache("list"), ctrl.getCategories);

router.get("/tree", categoryCache("tree"), ctrl.getCategoryTree);
router.get("/stats", ...adminOnly, ctrl.getCategoryStats);

router.get("/slug/:slug", validator.getBySlug, validate, categoryCache("slug"), ctrl.getCategoryBySlug);
router.get("/:id", validator.getById, validate, categoryCache("id"), ctrl.getCategoryById);

router.put("/:id", ...adminOnly, validator.updateCategory, validate, ctrl.updateCategory);
router.delete("/:id", ...adminOnly, validator.deleteById, validate, ctrl.deleteCategory);

router.post("/:id/restore", ...adminOnly, validator.restoreById, validate, ctrl.restoreCategory);

router.patch("/bulk", ...adminOnly, ctrl.bulkUpdateCategories);
router.post("/bulk-delete", ...adminOnly, ctrl.bulkDeleteCategories);

// subcategory (nested)
router.post("/:parentId/subcategories", ...adminOnly, validator.createSubcategory, validate, ctrl.createSubcategory);
router.get("/:parentId/subcategories", validator.getSubcategories, validate, categoryCache("subcategories"), ctrl.getSubcategories);
router.put("/:parentId/subcategories/reorder", ...adminOnly, validator.reorderSubcategories, validate,  ctrl.reorderSubcategories);

module.exports = router;
