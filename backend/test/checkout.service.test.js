process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret";

const assert = require("node:assert/strict");
const test = require("node:test");
const { toPaise, transitions } = require("../src/services/checkout.service");

test("checkout money and lifecycle use exact paise and legal transitions", () => {
  assert.equal(toPaise(199.99), 19999);
  assert.deepEqual(transitions.confirmed, ["processing", "cancelled"]);
  assert.equal(transitions.delivered.length, 0);
});
