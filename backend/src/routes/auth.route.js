const express = require("express");

const validate = require("../validators/index");
const v = require("../validators/auth.validator");

const auth = require("../middlewares/auth");
const { authLimiter, loginLimiter, loginEmailLimiter } = require("../middlewares/rateLimiters");

const authCtrl = require("../controllers/auth.controller");



const router = express.Router();



// Auth
router.post("/register", authLimiter, v.registerValidator, validate, authCtrl.register);

router.post("/verify-email", authLimiter, v.tokenValidator, validate, authCtrl.verifyEmail);

router.post("/resend-verification", authLimiter, v.resendVerificationValidator, validate, authCtrl.resendVerification);

router.post("/login", authLimiter, loginLimiter, loginEmailLimiter, v.loginValidator, validate, authCtrl.login);

router.post("/refresh", authLimiter, authCtrl.refresh);

router.post("/logout", authLimiter, authCtrl.logout);
router.post("/logout-all", auth, authCtrl.logoutAll);

router.get("/me", auth, authCtrl.me);

router.post("/forgot-password", authLimiter, v.forgotPasswordValidator, validate, authCtrl.forgotPassword);

router.post("/reset-password", authLimiter, v.resetPasswordValidator, validate, authCtrl.resetPassword);

router.post("/change-password", auth, v.changePasswordValidator, validate, authCtrl.changePassword);


module.exports = router;
