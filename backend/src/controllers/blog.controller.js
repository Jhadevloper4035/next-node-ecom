const Blog = require("../models/blog.model");

exports.listBlogs = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 100);
    const filter = { status: "active" };
    const [data, total] = await Promise.all([
      Blog.find(filter).sort({ created_at: -1 }).skip((page - 1) * limit).limit(limit).populate("seo"),
      Blog.countDocuments(filter),
    ]);

    res.json({ success: true, data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
};

exports.getBlogByUrl = async (req, res, next) => {
  try {
    const blog = await Blog.findByUrl(req.params.url).populate("seo");
    if (!blog) return res.status(404).json({ success: false, message: "Blog not found" });
    res.json({ success: true, data: blog });
  } catch (error) {
    next(error);
  }
};
