process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret";

const assert = require("node:assert/strict");
const test = require("node:test");
const { loginLimiter, loginEmailLimiter } = require("../src/middlewares/rateLimiters");

const run = (middleware) => new Promise((resolve) => middleware(
  { ip: "127.0.0.1", body: { email: "first@example.com" }, app: { get: () => false }, headers: {} },
  { setHeader: () => {}, status: () => ({ send: (body) => resolve({ blocked: true, body }) }), send: (body) => resolve({ blocked: true, body }) },
  () => resolve({ blocked: false }),
));

test("a first login request passes both login limiters", async () => {
  assert.equal((await run(loginLimiter)).blocked, false);
  assert.equal((await run(loginEmailLimiter)).blocked, false);
});
