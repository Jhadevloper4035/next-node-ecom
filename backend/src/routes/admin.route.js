

const router = require("express").Router();

const validate = require("../validators/index");
const v = require("../validators/auth.validator");

const auth = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");
const { authLimiter, loginLimiter, otpVerifyLimiter } = require("../middlewares/rateLimiters");


const adminCtrl = require("../controllers/admin.controller");




// Admin (requires login + admin role)
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