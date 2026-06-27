const assert = require("node:assert/strict");
const test = require("node:test");
const mongoose = require("mongoose");
const Review = require("../src/models/review.model");

const reviewData = (overrides = {}) => ({
  product: new mongoose.Types.ObjectId(),
  authorName: "Test Customer",
  authorEmail: "customer@example.com",
  title: "Comfortable and well made",
  comment: "The product feels sturdy, looks premium, and arrived in good condition.",
  rating: 5,
  ...overrides,
});

test("review accepts a valid customer review", async () => {
  const review = new Review(reviewData());

  await review.validate();

  assert.equal(review.status, "published");
  assert.equal(review.rating, 5);
});

test("review rejects ratings outside the supported range", async () => {
  const review = new Review(reviewData({ rating: 6 }));

  await assert.rejects(review.validate(), /more than maximum allowed value/);
});

test("review requires a real comment", async () => {
  const review = new Review(reviewData({ comment: "Too short" }));

  await assert.rejects(review.validate(), /shorter than the minimum allowed length/);
});
