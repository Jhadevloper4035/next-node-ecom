process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";

const assert = require("node:assert/strict");
const test = require("node:test");
const Blog = require("../src/models/blog.model");

test("blog categories and tags preserve customer-safe text and remove duplicate tags", () => {
  const blog = new Blog({
    title: "Comfort 🛋️",
    image: "https://example.com/blog.jpg",
    text: "Blog content",
    category: "Living Room 😊",
    tags: ["sofas", " decor ", "sofas", ""],
  });

  assert.equal(blog.category, "Living Room 😊");
  assert.deepEqual(blog.tags, ["sofas", "decor"]);
});
