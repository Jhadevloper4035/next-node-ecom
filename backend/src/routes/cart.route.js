const router = require("express").Router();
const auth = require("../middlewares/auth");
const validate = require("../validators");
const validator = require("../validators/cart.validator");
const controller = require("../controllers/cart.controller");

router.get("/", auth, controller.getCart);
router.put("/", auth, validator.replaceCartValidator, validate, controller.replaceCart);

module.exports = router;
