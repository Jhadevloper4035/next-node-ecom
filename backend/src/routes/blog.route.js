const router = require("express").Router();
const blogController = require("../controllers/blog.controller");

router.get("/", blogController.listBlogs);
router.get("/taxonomies", blogController.listBlogTaxonomies);
router.get("/sitemap", blogController.getSitemapBlogs);
router.get("/:url", blogController.getBlogByUrl);

module.exports = router;
