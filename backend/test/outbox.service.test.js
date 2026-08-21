process.env.MONGODB_URI ||= "mongodb://127.0.0.1:27017/curve-comfort-test";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret";

const assert = require("node:assert/strict");
const test = require("node:test");
const OutboxEvent = require("../src/models/outboxEvent.model");
const { monitorOutboxEvents, recordOutboxEvent } = require("../src/services/outbox.service");

test("outbox writes are deduplicated and use the caller transaction", async () => {
  const originalUpdateOne = OutboxEvent.updateOne;
  let call;
  OutboxEvent.updateOne = async (...args) => { call = args; };
  try {
    await recordOutboxEvent({ type: "ORDER_CONFIRMED", order: "order-1", paymentTransaction: "payment-1", dedupeKey: "ORDER_CONFIRMED:order-1", session: "session-1" });
    assert.deepEqual(call, [
      { dedupeKey: "ORDER_CONFIRMED:order-1" },
      { $setOnInsert: { type: "ORDER_CONFIRMED", order: "order-1", paymentTransaction: "payment-1", refund: null, dedupeKey: "ORDER_CONFIRMED:order-1" } },
      { upsert: true, session: "session-1" },
    ]);
  } finally {
    OutboxEvent.updateOne = originalUpdateOne;
  }
});

test("stale queued outbox events are returned to retryable state", async () => {
  const originals = { updateMany: OutboxEvent.updateMany, countDocuments: OutboxEvent.countDocuments, warn: console.warn, error: console.error };
  let recovery;
  OutboxEvent.updateMany = async (...args) => { recovery = args; return { modifiedCount: 1 }; };
  OutboxEvent.countDocuments = async () => 0;
  console.warn = () => {};
  console.error = () => {};
  const now = new Date("2026-08-21T12:00:00.000Z");
  try {
    assert.equal(await monitorOutboxEvents(now), 0);
    assert.deepEqual(recovery, [
      { status: "queued", updatedAt: { $lte: new Date("2026-08-21T11:45:00.000Z") } },
      { $set: { status: "failed", lastError: "Outbox queue claim expired", nextAttemptAt: now } },
    ]);
  } finally {
    OutboxEvent.updateMany = originals.updateMany;
    OutboxEvent.countDocuments = originals.countDocuments;
    console.warn = originals.warn;
    console.error = originals.error;
  }
});
