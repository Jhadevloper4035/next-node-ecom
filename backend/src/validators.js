const Joi = require("joi");

const email    = Joi.string().email().lowercase().required();
const password = Joi.string().min(10).max(72)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/)
  .messages({ "string.pattern.base": "Password must include uppercase, lowercase, number, and special character" });
const mobile   = Joi.string().pattern(/^\d{10,15}$/)
  .messages({ "string.pattern.base": "Mobile number must be 10-15 digits" });

// Auth
const registerSchema      = Joi.object({ fullName: Joi.string().trim().min(2).max(60).required(), email, password: password.required(), mobileNumber: mobile.required() });
const verifyOtpSchema     = Joi.object({ email, otp: Joi.string().pattern(/^\d{6}$/).required().messages({ "string.pattern.base": "OTP must be exactly 6 digits" }) });
const loginSchema         = Joi.object({ email, password: Joi.string().required() });
const resendOtpSchema     = Joi.object({ email });
const forgotPasswordSchema = Joi.object({ email });
const resetPasswordSchema = Joi.object({ token: Joi.string().min(20).required(), password: password.required() });
const refreshSchema       = Joi.object({ refreshToken: Joi.string().optional() });

// User
const updateProfileSchema = Joi.object({ fullName: Joi.string().trim().min(2).max(60), mobileNumber: mobile }).min(1);

// Admin
const updateRoleSchema = Joi.object({ role: Joi.string().valid("user", "admin").required() });
const blockUserSchema  = Joi.object({ isBlocked: Joi.boolean().required() });
const listUsersSchema  = Joi.object({ page: Joi.number().integer().min(1).default(1), limit: Joi.number().integer().min(1).max(100).default(20) });

module.exports = {
  registerSchema, verifyOtpSchema, loginSchema, resendOtpSchema,
  forgotPasswordSchema, resetPasswordSchema, refreshSchema,
  updateProfileSchema,
  updateRoleSchema, blockUserSchema, listUsersSchema,
};
