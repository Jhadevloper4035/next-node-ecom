const express = require("express");
const validate = require("../middlewares/validate");
const auth = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");
const { authLimiter, loginLimiter, otpVerifyLimiter } = require("../middlewares/rateLimiters");
const authCtrl = require("../controllers/authController");
const userCtrl = require("../controllers/userController");
const adminCtrl = require("../controllers/adminController");
const healthCtrl = require("../controllers/healthController");
const {
  registerSchema, verifyOtpSchema, loginSchema, resendOtpSchema,
  forgotPasswordSchema, resetPasswordSchema, refreshSchema,
  updateProfileSchema,
  updateRoleSchema, blockUserSchema, listUsersSchema,
} = require("../validators");

const r = express.Router();

// Health
r.get("/health", healthCtrl.health);

// Auth
r.post("/auth/register", authLimiter, validate(registerSchema), authCtrl.register);
r.post("/auth/verify-otp", authLimiter, otpVerifyLimiter, validate(verifyOtpSchema), authCtrl.verifyOtp);
r.post("/auth/resend-otp", authLimiter, validate(resendOtpSchema), authCtrl.resendOtp);
r.post("/auth/login", authLimiter, loginLimiter, validate(loginSchema), authCtrl.login);
r.post("/auth/refresh", authLimiter, validate(refreshSchema), authCtrl.refresh);
r.post("/auth/logout", authLimiter, validate(refreshSchema), authCtrl.logout);
r.get("/auth/me", auth, authCtrl.me);
r.post("/auth/forgot-password", authLimiter, validate(forgotPasswordSchema), authCtrl.forgotPassword);
r.post("/auth/reset-password", authLimiter, validate(resetPasswordSchema), authCtrl.resetPassword);

// User (requires login)
r.get("/users/profile", auth, userCtrl.getProfile);
r.patch("/users/profile", auth, validate(updateProfileSchema), userCtrl.updateProfile);

// Admin (requires login + admin role)
r.get("/admin/users", auth, requireRole("admin"), validate(listUsersSchema, "query"), adminCtrl.listUsers);
r.patch("/admin/users/:id/role", auth, requireRole("admin"), validate(updateRoleSchema), adminCtrl.updateUserRole);
r.patch("/admin/users/:id/block", auth, requireRole("admin"), validate(blockUserSchema), adminCtrl.blockUser);

module.exports = r;
