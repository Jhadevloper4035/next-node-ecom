const assert = require("node:assert/strict");
const test = require("node:test");
const mongoose = require("mongoose");
const { withTransaction } = require("../src/services/transaction.service");

test("transactions pass one session to the work and always close it", async () => {
  const originalStartSession = mongoose.startSession;
  const session = { withTransaction: async (work) => work(session), endSession: async () => { session.closed = true; } };
  mongoose.startSession = async () => session;
  try {
    assert.equal(await withTransaction(async (currentSession) => currentSession === session ? "committed" : "wrong session"), "committed");
    assert.equal(session.closed, true);
  } finally {
    mongoose.startSession = originalStartSession;
  }
});

test("transactions close their session when payment confirmation aborts", async () => {
  const originalStartSession = mongoose.startSession;
  const session = { withTransaction: async (work) => work(session), endSession: async () => { session.closed = true; } };
  mongoose.startSession = async () => session;
  try {
    await assert.rejects(withTransaction(async () => { throw new Error("payment update failed"); }), /payment update failed/);
    assert.equal(session.closed, true);
  } finally {
    mongoose.startSession = originalStartSession;
  }
});
