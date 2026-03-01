const express = require("express");
const router = express.Router();

const productController = require("../controllers/productController");
const v = require("../validators/product.validator");

const validate = require("../validators/index.js")

// Public
router.get("/", v.listProductsValidator, validate, productController.listProducts);
router.get("/slug/:slug", v.getBySlugValidator, validate, productController.getBySlug);



// By category/subcategory slugs
router.get("/category/:categorySlug", productController.getByCategorySlug);
router.get("/category/:categorySlug/subcategory/:subcategorySlug", productController.getByCategoryAndSubcategorySlug
);



// Admin / Protected (add auth middleware as you have)
router.post("/", v.createProductValidator, validate, productController.createProduct);
router.put("/:id", v.updateProductValidator, validate, productController.updateProduct);
router.delete("/:id", v.deleteProductValidator, validate, productController.softDeleteProduct);

module.exports = router;