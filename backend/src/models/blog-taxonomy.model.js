const mongoose = require("mongoose");
const slugify = require("slugify");

const blogTaxonomySchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["category", "tag"], required: true, index: true },
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    slug: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

blogTaxonomySchema.index({ type: 1, slug: 1 }, { unique: true });

blogTaxonomySchema.pre("validate", function (next) {
  this.slug = slugify(this.slug || this.name, { lower: true, strict: true });
  next();
});

module.exports = mongoose.model("BlogTaxonomy", blogTaxonomySchema);
