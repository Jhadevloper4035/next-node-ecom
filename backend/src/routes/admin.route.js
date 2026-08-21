

const router = require("express").Router();

const validate = require("../validators/index");
const v = require("../validators/auth.validator");
const checkout = require("../validators/checkout.validator");

const auth = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");


const adminCtrl = require("../controllers/admin.controller");




// Admin (requires login + admin role)
router.get("/dashboard", auth, requireRole("admin"), adminCtrl.dashboard);
router.get("/monitoring", auth, requireRole("admin"), adminCtrl.monitoring);
router.get("/payments", auth, requireRole("admin"), checkout.adminPaymentSearchValidator, validate, adminCtrl.paymentTimeline);
router.post("/payments/:orderId/reconcile", auth, requireRole("admin"), checkout.adminReconcileValidator, validate, adminCtrl.reconcilePayment);
router.get("/users", auth, requireRole("admin"), v.listUsersValidator, validate, adminCtrl.listUsers);

router.patch("/users/:id/role", auth, requireRole("admin"), v.updateRoleValidator,
    validate,
    adminCtrl.updateUserRole
);

router.patch(
    "/users/:id/block",
    auth,
    requireRole("admin"),
    v.blockUserValidator,
    validate,
    adminCtrl.blockUser
);

module.exports = router;
