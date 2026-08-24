const router = require("express").Router();
const auth = require("../middlewares/auth");
const validate = require("../validators");
const validator = require("../validators/wishlist.validator");
const controller = require("../controllers/wishlist.controller");

router.get("/", auth, controller.getWishlist);
router.put("/", auth, validator.replaceWishlistValidator, validate, controller.replaceWishlist);

module.exports = router;
