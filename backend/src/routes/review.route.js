const express = require("express");
const router = express.Router();

const reviewController = require("../controllers/review.controller");
const v = require("../validators/review.validator");
const validate = require("../validators/index");
const { env } = require("../config/env");
const cacheResponse = require("../middlewares/cacheResponse");
const auth = require("../middlewares/auth");

router.get(
  "/product/:productId",
  v.listProductReviewsValidator,
  validate,
  cacheResponse({
    namespace: "reviews",
    resource: "product",
    ttlSeconds: env.cacheProductTtlSeconds,
  }),
  reviewController.listProductReviews,
);

router.post(
  "/product/:productId",
  auth,
  v.createProductReviewValidator,
  validate,
  reviewController.createProductReview,
);

module.exports = router;
