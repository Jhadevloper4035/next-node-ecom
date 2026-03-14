
const router = require("express").Router();
const ctrl = require("../controllers/address.controller");
const auth = require("../middlewares/auth");

const validate = require("../validators/index");
const v = require("../validators/address.validator");
router.get("/", auth, ctrl.getAllAddresses);
router.post("/", auth, v.createAddressValidator, validate, ctrl.createMyAddress);
router.put("/:addressId", auth, v.updateAddressValidator, validate, ctrl.updateMyAddress);
router.delete("/:addressId", auth, v.deleteAddressValidator, validate, ctrl.deleteMyAddress);
router.patch("/:addressId/default", auth, v.setDefaultAddressValidator, validate, ctrl.setDefaultAddress);

module.exports = router;