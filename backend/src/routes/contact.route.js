const express = require("express");
const router = express.Router();

const validate = require("../validators/index"); // ✅ common middleware
const v = require("../validators/contact.validator"); // ✅ contact validator
const { submitContact } = require("../controllers/contact.controller");

// ================= CONTACT ROUTE =================
router.post(
  "/submit",
  v.createContactValidator,
  validate,
  submitContact
);

module.exports = router;