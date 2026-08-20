const router = require("express").Router();
const auth = require("../middlewares/auth");
const validate = require("../validators");
const { checkoutLimiter } = require("../middlewares/rateLimiters");
const validator = require("../validators/checkout.validator");
const controller = require("../controllers/checkout.controller");

router.post("/", auth, checkoutLimiter, validator.createCheckoutValidator, validate, controller.createCheckout);
router.get("/active", auth, controller.getActiveCheckout);

module.exports = router;
