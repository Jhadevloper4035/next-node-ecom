const express = require("express");
const router = express.Router();

const productController = require("../controllers/product.controller");

const v = require("../validators/product.validator");
const validate = require("../validators/index")
const { env } = require("../config/env");
const cacheResponse = require("../middlewares/cacheResponse");

// Public
router.get(
  "/",
  v.listProductsValidator,
  validate,
  cacheResponse({
    namespace: "products",
    resource: "list",
    ttlSeconds: env.cacheProductListTtlSeconds,
  }),
  productController.listProducts,
);
router.get(
  "/slug/:slug",
  v.getBySlugValidator,
  validate,
  cacheResponse({
    namespace: "products",
    resource: "slug",
    ttlSeconds: env.cacheProductTtlSeconds,
  }),
  productController.getBySlug,
);


// By category/subcategory slugs
router.get(
  "/category/:categorySlug",
  cacheResponse({
    namespace: "products",
    resource: "category",
    ttlSeconds: env.cacheProductListTtlSeconds,
  }),
  productController.getByCategorySlug,
);
router.get(
  "/category/:categorySlug/subcategory/:subcategorySlug",
  cacheResponse({
    namespace: "products",
    resource: "subcategory",
    ttlSeconds: env.cacheProductListTtlSeconds,
  }),
  productController.getByCategoryAndSubcategorySlug,
);


// Admin / Protected (add auth middleware as you have)
router.post("/", v.createProductValidator, validate, productController.createProduct);
router.put("/:id", v.updateProductValidator, validate, productController.updateProduct);
router.delete("/:id", v.deleteProductValidator, validate, productController.softDeleteProduct);

module.exports = router;
