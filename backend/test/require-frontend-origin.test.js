process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret";

const assert = require("node:assert/strict");
const test = require("node:test");
const requireFrontendOrigin = require("../src/middlewares/requireFrontendOrigin");

const run = ({ method, origin }) => {
  let nextCalled = false;
  let result;
  requireFrontendOrigin(["https://curve-comfort.com", "http://localhost:3000"])(
    { method, get: (name) => name === "origin" ? origin : undefined },
    { status: (status) => ({ json: (body) => { result = { status, body }; } }) },
    () => { nextCalled = true; },
  );
  return { nextCalled, result };
};

test("unsafe requests require the configured frontend origin", () => {
  assert.equal(run({ method: "POST", origin: "https://curve-comfort.com" }).nextCalled, true);
  assert.equal(run({ method: "POST", origin: "http://localhost:3000" }).nextCalled, true);
  assert.equal(run({ method: "POST", origin: "https://attacker.example" }).result.status, 403);
  assert.equal(run({ method: "GET", origin: "https://attacker.example" }).nextCalled, true);
});
