const express = require("express");
const router = express.Router();

const productController = require("../controllers/product.controller");

const v = require("../validators/product.validator");
const validate = require("../validators/index")
const { env } = require("../config/env");
const cacheResponse = require("../middlewares/cacheResponse");
const auth = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");

const adminOnly = [auth, requireRole("admin")];

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
router.get("/sitemap", productController.getSitemapProducts);


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


router.post("/", ...adminOnly, v.createProductValidator, validate, productController.createProduct);
router.put("/:id", ...adminOnly, v.updateProductValidator, validate, productController.updateProduct);
router.delete("/:id", ...adminOnly, v.deleteProductValidator, validate, productController.softDeleteProduct);

module.exports = router;
