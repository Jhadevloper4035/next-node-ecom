process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret";
process.env.JWT_REFRESH_SECRET ||= "test-refresh-secret";

const assert = require("node:assert/strict");
const test = require("node:test");
const { env } = require("../src/config/env");
const { signAccessToken } = require("../src/config/token");
const User = require("../src/models/user.model");
const Session = require("../src/models/session.model");
const auth = require("../src/controllers/auth.controller");

function response() {
  return {
    clearedCookies: [],
    statusCode: null,
    body: null,
    clearCookie(name) { this.clearedCookies.push(name); },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

async function invoke(handler, req, res) {
  let error;
  await handler(req, res, (nextError) => { error = nextError; });
  return error;
}

test("session probe is quiet for guests and clears invalid refresh cookies", async () => {
  const anonymousResponse = response();
  const anonymousError = await invoke(auth.me, { headers: {}, cookies: {} }, anonymousResponse);
  assert.equal(anonymousError, undefined);
  assert.equal(anonymousResponse.statusCode, 200);
  assert.equal(anonymousResponse.body.data.user, null);

  const originalFindOneAndUpdate = Session.findOneAndUpdate;
  const originalFindOne = Session.findOne;
  try {
    Session.findOneAndUpdate = async () => null;
    Session.findOne = () => ({ select: async () => null });

    const staleResponse = response();
    const staleError = await invoke(auth.refresh, { headers: {}, cookies: { [env.cookieName]: "stale-token" } }, staleResponse);
    assert.equal(staleError?.statusCode, 401);
    assert.deepEqual(staleResponse.clearedCookies.sort(), [env.accessCookieName, env.cookieName].sort());
  } finally {
    Session.findOneAndUpdate = originalFindOneAndUpdate;
    Session.findOne = originalFindOne;
  }
});

test("session probe returns the authenticated user", async () => {
  const user = {
    _id: "507f1f77bcf86cd799439011",
    fullName: "Test User",
    email: "test@example.com",
    mobileNumber: "9999999999",
    role: "user",
    isEmailVerified: true,
    isBlocked: false,
    tokenVersion: 0,
  };
  const originalFindById = User.findById;
  try {
    User.findById = async () => user;
    const res = response();
    const token = signAccessToken({ sub: user._id, role: user.role, tokenVersion: user.tokenVersion });
    const error = await invoke(auth.me, { headers: {}, cookies: { [env.accessCookieName]: token } }, res);
    assert.equal(error, undefined);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.data.user.email, user.email);
  } finally {
    User.findById = originalFindById;
  }
});
