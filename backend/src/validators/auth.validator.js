const { body, query } = require("express-validator");

const emailRule = () =>
  body("email")
    .isEmail()
    .withMessage("Invalid email")
    .bail()
    .normalizeEmail()
    .notEmpty()
    .withMessage("Email is required");

const passwordRule = (field = "password") =>
  body(field)
    .isString()
    .withMessage("Password must be a string")
    .bail()
    .isLength({ min: 8, max: 16 })
    .withMessage("Password must be between 8 and 16 characters")
    .bail()
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/)
    .withMessage(
      "Password must include uppercase, lowercase, number, and special character"
    );

const mobileRule = () =>
  body("mobileNumber")
    .matches(/^\d{10,15}$/)
    .withMessage("Mobile number must be 10-15 digits");

/**
 * Auth Validators
 */
exports.registerValidator = [
  body("fullName")
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage("Full name must be 2-60 characters")
    .notEmpty()
    .withMessage("Full name is required"),

  emailRule(),
  passwordRule("password"),
  mobileRule(),
];

exports.tokenValidator = [
  body("token")
    .isString()
    .withMessage("Token must be a string")
    .bail()
    .isLength({ min: 20 })
    .withMessage("Token must be at least 20 characters"),
];

exports.loginValidator = [
  emailRule(),
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
];

exports.resendVerificationValidator = [emailRule()];

exports.forgotPasswordValidator = [emailRule()];

exports.resetPasswordValidator = [
  ...exports.tokenValidator,
  passwordRule("password"),
];


/**
 * User Validators
 */
exports.updateProfileValidator = [
  body().custom((value, { req }) => {
    const hasAny =
      typeof req.body.fullName !== "undefined" ||
      typeof req.body.mobileNumber !== "undefined";

    if (!hasAny) throw new Error("At least one field is required");
    return true;
  }),

  body("fullName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 60 })
    .withMessage("Full name must be 2-60 characters"),

  body("mobileNumber")
    .optional()
    .matches(/^\d{10,15}$/)
    .withMessage("Mobile number must be 10-15 digits"),
];

/**
 * Admin Validators
 */
exports.updateRoleValidator = [
  body("role")
    .isIn(["user", "admin"])
    .withMessage("Role must be either user or admin"),
];

exports.blockUserValidator = [
  body("isBlocked")
    .isBoolean()
    .withMessage("isBlocked must be boolean"),
];

exports.listUsersValidator = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page must be an integer >= 1")
    .toInt(),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be between 1 and 100")
    .toInt(),
];


exports.changePasswordValidator = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),

  body("newPassword")
    .trim()
    .isLength({ min: 8, max: 16 })
    .withMessage("New password must be between 8 and 16 characters")
    .bail()
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/)
    .withMessage(
      "New password must include uppercase, lowercase, number, and special character"
    ),

];
