const mongoose = require("mongoose");

const seoKeywords = {
  type: [String],
  default: [],
  set: (value) => {
    const values = Array.isArray(value) ? value : String(value || "").split(",");
    return [...new Set(values.map((item) => String(item).trim()).filter(Boolean))];
  },
};

module.exports = new mongoose.Schema(
  {
    title: { type: String, trim: true, maxlength: 60, default: "" },
    description: { type: String, trim: true, maxlength: 160, default: "" },
    keywords: seoKeywords,
    robots: { type: String, trim: true, maxlength: 160, default: "index, follow" },
    canonicalUrl: { type: String, trim: true, maxlength: 500, default: "" },
    ogTitle: { type: String, trim: true, maxlength: 100, default: "" },
    ogDescription: { type: String, trim: true, maxlength: 200, default: "" },
    ogImage: { type: String, trim: true, maxlength: 500, default: "" },
    ogType: { type: String, trim: true, maxlength: 40, default: "website" },
    twitterTitle: { type: String, trim: true, maxlength: 100, default: "" },
    twitterDescription: { type: String, trim: true, maxlength: 200, default: "" },
    twitterImage: { type: String, trim: true, maxlength: 500, default: "" },
    schemaMarkup: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { _id: false }
);
