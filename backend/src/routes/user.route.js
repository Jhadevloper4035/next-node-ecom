
const router = require("express").Router();

const validate = require("../validators/index");
const v = require("../validators/auth.validator");

const auth = require("../middlewares/auth");
const requireRole = require("../middlewares/requireRole");
const { authLimiter, loginLimiter, otpVerifyLimiter } = require("../middlewares/rateLimiters");




const userCtrl = require("../controllers/user.controller");


// User (requires login)
router.get("/profile", auth, userCtrl.getProfile);
router.patch("/profile", auth, v.updateProfileValidator, validate, userCtrl.updateProfile);


module.exports = router;