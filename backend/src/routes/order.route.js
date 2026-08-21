const router = require("express").Router();
const auth = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");
const validate = require("../validators");
const validator = require("../validators/checkout.validator");
const { emailResendLimiter, refundLimiter } = require("../middlewares/rateLimiters");
const controller = require("../controllers/order.controller");

router.get("/", auth, controller.listMyOrders);
router.get("/:orderId", auth, validator.orderIdValidator, validate, controller.getMyOrder);
router.patch("/:orderId/status", auth, requireRole("admin"), validator.statusValidator, validate, controller.updateOrderStatus);
router.post("/:orderId/refunds", auth, requireRole("admin"), refundLimiter, validator.refundValidator, validate, controller.createRefund);
router.post("/:orderId/emails/:emailEventId/resend", auth, requireRole("admin"), emailResendLimiter, validator.emailResendValidator, validate, controller.resendEmail);

module.exports = router;
