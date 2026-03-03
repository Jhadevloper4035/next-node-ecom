
const router = require("express").Router();
const ctrl = require("../controllers/address.controller");

const validate = require("../validators/index");
const v = require("../validators/address.validator");

router.get("/", ctrl.getAllAddresses);
router.post("/", v.createAddressValidator, validate, ctrl.createMyAddress);
router.put("/:addressId", v.updateAddressValidator, validate, ctrl.updateMyAddress);
router.delete("/:addressId", v.deleteAddressValidator, validate, ctrl.deleteMyAddress);
router.patch("/:addressId/default", v.setDefaultAddressValidator, validate, ctrl.setDefaultAddress);

module.exports = router;