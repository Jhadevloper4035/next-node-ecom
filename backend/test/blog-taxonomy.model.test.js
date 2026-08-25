process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";

const assert = require("node:assert/strict");
const test = require("node:test");
const BlogTaxonomy = require("../src/models/blog-taxonomy.model");

test("blog taxonomy creates the CMS-compatible slug", () => {
  const taxonomy = new BlogTaxonomy({ type: "category", name: "Living Room Ideas" });

  assert.equal(taxonomy.type, "category");
  assert.equal(taxonomy.slug, undefined);
  return taxonomy.validate().then(() => assert.equal(taxonomy.slug, "living-room-ideas"));
});
