const Blog = require("../models/blog.model");
const BlogTaxonomy = require("../models/blog-taxonomy.model");
const xss = require("xss");

const queryValue = (value) => typeof value === "string" ? value.trim().slice(0, 80) : "";
const isTemplateBlog = (blog) => /^\/images\/blog\//.test(blog.image || "");
const publicBlog = (blog) => ({
  ...(blog.toObject ? blog.toObject() : blog),
  text: xss(blog.text || ""),
});

exports.listBlogs = async (req, res, next) => {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 100);
    const filter = { status: "active", image: { $not: /^\/images\/blog\// } };
    const category = queryValue(req.query.category);
    const tag = queryValue(req.query.tag);
    if (category) filter.category = category;
    if (tag) filter.tags = tag;
    const [data, total] = await Promise.all([
      Blog.find(filter).sort({ created_at: -1 }).skip((page - 1) * limit).limit(limit).populate("seo"),
      Blog.countDocuments(filter),
    ]);

    res.json({ success: true, data: data.map(publicBlog), meta: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
};

exports.listBlogTaxonomies = async (req, res, next) => {
  try {
    const taxonomies = await BlogTaxonomy.find({ type: { $in: ["category", "tag"] } })
      .sort({ name: 1 })
      .select("type name slug");
    const data = { category: [], tag: [] };

    taxonomies.forEach((taxonomy) => data[taxonomy.type].push(taxonomy));
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.getBlogByUrl = async (req, res, next) => {
  try {
    const blog = await Blog.findByUrl(req.params.url).populate("seo");
    if (!blog || isTemplateBlog(blog)) return res.status(404).json({ success: false, message: "Blog not found" });
    res.json({ success: true, data: publicBlog(blog) });
  } catch (error) {
    next(error);
  }
};
