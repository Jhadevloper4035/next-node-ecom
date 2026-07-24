process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret";
process.env.JWT_REFRESH_SECRET ||= "test-refresh-secret";

const test = require("node:test");
const assert = require("node:assert/strict");

const User = require("../src/models/user.model");
const errorHandler = require("../src/middlewares/errorHandler");

test("user model accepts stored bcrypt password hashes", async () => {
  const user = new User({
    fullName: "Test User",
    email: "test@example.com",
    password: "$2a$12$m9sFX4tSIEAB6JlehNJ21u6Z9phsrAlqIH3XkUyWrryp/Jf11p2Wi",
    mobileNumber: "9999999999",
  });

  await user.validate();
});

test("validation errors do not expose password values", () => {
  const err = new Error("User validation failed: password: Path `password` (`$2a$12$secret`, length 60) is longer than the maximum allowed length (16).");
  err.name = "ValidationError";
  err.errors = { password: { value: "$2a$12$secret" } };

  let statusCode;
  let body;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(value) {
      body = value;
    },
  };

  errorHandler(err, { method: "POST", originalUrl: "/api/v1/auth/register" }, res, () => {});

  assert.equal(statusCode, 400);
  assert.equal(body.message, "Something went wrong. Please try again later.");
  assert.equal(JSON.stringify(body).includes("$2a$12$secret"), false);
});
