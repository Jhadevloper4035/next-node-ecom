process.env.MONGODB_URI ||= "mongodb://localhost:27017/test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret";

const assert = require("node:assert/strict");
const test = require("node:test");
const jwt = require("jsonwebtoken");
const { signAccessToken, verifyAccessToken, createRefreshToken, hashRefreshToken } = require("../src/config/token");
const auth = require("../src/middlewares/auth");
const requireRole = require("../src/middlewares/requireRole");
const User = require("../src/models/user.model");

test("access tokens are JWTs and refresh tokens are opaque hashed values", () => {
  const payload = { sub: "507f1f77bcf86cd799439011", role: "user" };
  assert.equal(verifyAccessToken(signAccessToken(payload)).type, "access");
  const refreshToken = createRefreshToken();
  assert.equal(refreshToken.includes("."), false);
  assert.equal(hashRefreshToken(refreshToken).length, 64);
});

test("authentication rejects a refresh-type token signed with the access secret", async () => {
  const token = jwt.sign({ sub: "507f1f77bcf86cd799439011", type: "refresh" }, process.env.JWT_ACCESS_SECRET);
  const error = await new Promise((resolve) => auth({ headers: { authorization: `Bearer ${token}` } }, {}, resolve));
  assert.equal(error.statusCode, 401);
});

test("authentication rejects access tokens issued before account-wide revocation", async () => {
  const userId = "507f1f77bcf86cd799439011";
  const originalFindById = User.findById;
  User.findById = () => ({
    select: async () => ({ _id: { toString: () => userId }, role: "user", isBlocked: false, tokenVersion: 2 }),
  });

  try {
    const token = signAccessToken({ sub: userId, role: "user", tokenVersion: 1 });
    const error = await new Promise((resolve) => auth({ headers: { authorization: `Bearer ${token}` } }, {}, resolve));
    assert.equal(error.statusCode, 401);
  } finally {
    User.findById = originalFindById;
  }
});

test("an admin role in a stale or forged token cannot bypass the database role", async () => {
  const userId = "507f1f77bcf86cd799439011";
  const originalFindById = User.findById;
  User.findById = () => ({
    select: async () => ({ _id: { toString: () => userId }, role: "user", isBlocked: false, tokenVersion: 1 }),
  });
  const req = { headers: { authorization: `Bearer ${signAccessToken({ sub: userId, role: "admin", tokenVersion: 1 })}` } };
  try {
    await new Promise((resolve) => auth(req, {}, (error) => { assert.equal(error, undefined); resolve(); }));
    const error = await new Promise((resolve) => requireRole("admin")(req, {}, resolve));
    assert.equal(req.user.role, "user");
    assert.equal(error.statusCode, 403);
  } finally {
    User.findById = originalFindById;
  }
});
