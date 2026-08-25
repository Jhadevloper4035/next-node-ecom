const SeoMeta = require("../models/seoFields.model");

exports.getPageSeo = async (req, res, next) => {
  try {
    const pageSlug = String(req.params.pageSlug || "").trim().toLowerCase();
    const seo = await SeoMeta.findOne({ pageSlug, pageCategory: "static", isActive: true }).lean();

    if (!seo) {
      return res.status(404).json({ success: false, message: "Page SEO not found" });
    }

    return res.json({ success: true, data: seo });
  } catch (error) {
    return next(error);
  }
};

exports.getPageSeoSitemap = async (_req, res, next) => {
  try {
    const pages = await SeoMeta.find({ pageCategory: "static", isActive: true })
      .select("canonicalUrl priority updatedAt")
      .lean();

    return res.json({ success: true, data: pages });
  } catch (error) {
    return next(error);
  }
};
