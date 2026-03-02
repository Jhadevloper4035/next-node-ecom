const router = require("express").Router();
const ctrl = require("../controllers/category.controller.js");
const validator = require("../validators/category.validator.js");
const validate  = require("../validators/index.js")

// category
router.post("/", validator.createCategory, validate , ctrl.createCategory);
router.get("/", validator.getCategories, validate , ctrl.getCategories);

router.get("/tree", ctrl.getCategoryTree);
router.get("/stats", ctrl.getCategoryStats);

router.get("/slug/:slug", validator.getBySlug, validate, ctrl.getCategoryBySlug);
router.get("/:id", validator.getById, validate, ctrl.getCategoryById);

router.put("/:id", validator.updateCategory, validate, ctrl.updateCategory);
router.delete("/:id", validator.deleteById, validate, ctrl.deleteCategory);

router.post("/:id/restore", validator.restoreById, validate, ctrl.restoreCategory);

router.patch("/bulk", ctrl.bulkUpdateCategories);
router.post("/bulk-delete", ctrl.bulkDeleteCategories);

// subcategory (nested)
router.post("/:parentId/subcategories", validator.createSubcategory, validate, ctrl.createSubcategory);
router.get("/:parentId/subcategories", validator.getSubcategories, validate, ctrl.getSubcategories);
router.put("/:parentId/subcategories/reorder", validator.reorderSubcategories, validate,  ctrl.reorderSubcategories);

module.exports = router;