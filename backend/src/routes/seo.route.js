const express = require("express");
const { getPageSeo, getPageSeoSitemap } = require("../controllers/seo.controller");

const router = express.Router();

router.get("/sitemap", getPageSeoSitemap);
router.get("/:pageSlug", getPageSeo);

module.exports = router;
