const router = require("express").Router();
const auth = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");
const validate = require("../validators");
const validator = require("../validators/coupon.validator");
const controller = require("../controllers/coupon.controller");

router.get("/:code", auth, validator.couponCodeValidator, validate, controller.getCoupon);
router.post("/", auth, requireRole("admin"), validator.createCouponValidator, validate, controller.createCoupon);
router.patch("/:couponId", auth, requireRole("admin"), validator.updateCouponValidator, validate, controller.updateCoupon);

module.exports = router;
