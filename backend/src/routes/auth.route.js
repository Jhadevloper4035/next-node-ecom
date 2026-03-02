const express = require("express");
const validate = require("../middlewares/validate");
const auth = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");
const { authLimiter, loginLimiter, otpVerifyLimiter } = require("../middlewares/rateLimiters");

const authCtrl = require("../controllers/auth.controller");
const userCtrl = require("../controllers/user.controller");
const adminCtrl = require("../controllers/admin.controller");
const healthCtrl = require("../controllers/health.controller");

const {
  registerSchema, verifyOtpSchema, loginSchema, resendOtpSchema,
  forgotPasswordSchema, resetPasswordSchema, refreshSchema,
  updateProfileSchema,
  updateRoleSchema, blockUserSchema, listUsersSchema,
} = require("../validators");

const router = express.Router();

// Health
router.get("/health", healthCtrl.health);

// Auth
router.post("/auth/register", authLimiter, validate(registerSchema), authCtrl.register);
router.post("/auth/verify-otp", authLimiter, otpVerifyLimiter, validate(verifyOtpSchema), authCtrl.verifyOtp);
router.post("/auth/resend-otp", authLimiter, validate(resendOtpSchema), authCtrl.resendOtp);
router.post("/auth/login", authLimiter, loginLimiter, validate(loginSchema), authCtrl.login);
router.post("/auth/refresh", authLimiter, validate(refreshSchema), authCtrl.refresh);
router.post("/auth/logout", authLimiter, validate(refreshSchema), authCtrl.logout);
router.get("/auth/me", auth, authCtrl.me);
router.post("/auth/forgot-password", authLimiter, validate(forgotPasswordSchema), authCtrl.forgotPassword);
router.post("/auth/reset-password", authLimiter, validate(resetPasswordSchema), authCtrl.resetPassword);

// User (requires login)
router.get("/users/profile", auth, userCtrl.getProfile);
router.patch("/users/profile", auth, validate(updateProfileSchema), userCtrl.updateProfile);

// Admin (requires login + admin role)
router.get("/admin/users", auth, requireRole("admin"), validate(listUsersSchema, "query"), adminCtrl.listUsers);
router.patch("/admin/users/:id/role", auth, requireRole("admin"), validate(updateRoleSchema), adminCtrl.updateUserRole);
router.patch("/admin/users/:id/block", auth, requireRole("admin"), validate(blockUserSchema), adminCtrl.blockUser);

module.exports = router;
