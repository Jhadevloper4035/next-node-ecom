const router = require("express").Router();
const blogController = require("../controllers/blog.controller");

router.get("/", blogController.listBlogs);
router.get("/:url", blogController.getBlogByUrl);

module.exports = router;
