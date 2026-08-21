process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret";

const assert = require("node:assert/strict");
const test = require("node:test");
const mongoose = require("mongoose");
const { supportsTransactions } = require("../src/config/db");

test("checkout transactions require a replica-set MongoDB topology", () => {
  const originalClient = mongoose.connection.client;
  mongoose.connection.client = { topology: { description: { type: "ReplicaSetWithPrimary" } } };
  assert.equal(supportsTransactions(), true);
  mongoose.connection.client = { topology: { description: { type: "Single" } } };
  assert.equal(supportsTransactions(), false);
  mongoose.connection.client = originalClient;
});
