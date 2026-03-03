const express = require("express");

const validate = require("../validators/index");
const v = require("../validators/auth.validator");

const auth = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");
const { authLimiter, loginLimiter, otpVerifyLimiter } = require("../middlewares/rateLimiters");

const authCtrl = require("../controllers/auth.controller");



const router = express.Router();



// Auth
router.post("/register", authLimiter, v.registerValidator, validate, authCtrl.register);

router.post(
  "/verify-otp",
  authLimiter,
  otpVerifyLimiter,
  v.verifyOtpValidator,
  validate,
  authCtrl.verifyOtp
);

router.post("/resend-otp", authLimiter, v.resendOtpValidator, validate, authCtrl.resendOtp);

router.post("/login", authLimiter, loginLimiter, v.loginValidator, validate, authCtrl.login);

router.post("/refresh", authLimiter, v.refreshValidator, validate, authCtrl.refresh);

router.post("/logout", authLimiter, v.refreshValidator, validate, authCtrl.logout);

router.get("/me", auth, authCtrl.me);

router.post("/forgot-password", authLimiter, v.forgotPasswordValidator, validate, authCtrl.forgotPassword);

router.post("/reset-password", authLimiter, v.resetPasswordValidator, validate, authCtrl.resetPassword);

router.post("/change-password", auth, v.changePasswordValidator, validate, authCtrl.changePassword);


module.exports = router;