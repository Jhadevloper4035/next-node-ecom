const router = require("express").Router();
const auth = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");
const validate = require("../validators");
const validator = require("../validators/checkout.validator");
const controller = require("../controllers/order.controller");

router.get("/", auth, controller.listMyOrders);
router.get("/:orderId", auth, validator.orderIdValidator, validate, controller.getMyOrder);
router.patch("/:orderId/status", auth, requireRole("admin"), validator.statusValidator, validate, controller.updateOrderStatus);

module.exports = router;
