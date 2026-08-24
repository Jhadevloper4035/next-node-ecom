process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";

const assert = require("node:assert/strict");
const test = require("node:test");
const { validationResult } = require("express-validator");
const { subscribeValidator } = require("../src/validators/newsletter.validator");

async function validateSubscription(body) {
  const req = { body };
  await Promise.all(subscribeValidator.map((rule) => rule.run(req)));
  return validationResult(req);
}

test("newsletter subscriptions accept a valid email only", async () => {
  assert.equal((await validateSubscription({ email: "customer@example.com" })).isEmpty(), true);
  assert.equal((await validateSubscription({ email: "not-an-email" })).isEmpty(), false);
  assert.equal((await validateSubscription({ email: "customer@example.com", source: "popup" })).isEmpty(), false);
});
