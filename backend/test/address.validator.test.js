process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret";

const assert = require("node:assert/strict");
const test = require("node:test");
const { validationResult } = require("express-validator");
const { updateAddressValidator } = require("../src/validators/address.validator");

async function validateUpdate(body) {
  const req = { body, params: { addressId: "507f1f77bcf86cd799439011" } };
  await Promise.all(updateAddressValidator.map((rule) => rule.run(req)));
  return validationResult(req);
}

test("address updates reject ownership fields", async () => {
  assert.equal((await validateUpdate({ city: "Delhi" })).isEmpty(), true);
  assert.equal((await validateUpdate({ user: "507f1f77bcf86cd799439012" })).isEmpty(), false);
  assert.equal((await validateUpdate({ isActive: false })).isEmpty(), false);
});
