const express = require("express");
const { subscribe } = require("../controllers/newsletter.controller");
const validate = require("../validators");
const { subscribeValidator } = require("../validators/newsletter.validator");

const router = express.Router();

router.post("/subscribe", subscribeValidator, validate, subscribe);

module.exports = router;
