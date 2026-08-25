const OutboxEvent = require("../models/outboxEvent.model");
const { enqueueEvent } = require("../queues/event.queue");
const logger = require("../config/logger");

async function recordOutboxEvent({ type, order, paymentTransaction, refund, dedupeKey, session }) {
  await OutboxEvent.updateOne(
    { dedupeKey },
    { $setOnInsert: { type, order, paymentTransaction: paymentTransaction || null, refund: refund || null, dedupeKey } },
    { upsert: true, ...(session && { session }) },
  );
}

async function dispatchOutboxEvents() {
  const now = new Date();
  const events = await OutboxEvent.find({ status: { $in: ["pending", "failed"] }, nextAttemptAt: { $lte: now } }).sort({ createdAt: 1 }).limit(100);
  for (const event of events) {
    const claimed = await OutboxEvent.findOneAndUpdate(
      { _id: event._id, status: { $in: ["pending", "failed"] }, nextAttemptAt: { $lte: now } },
      { $set: { status: "queued", lastError: "" }, $inc: { publishAttempts: 1 } },
      { new: true },
    );
    if (!claimed) continue;
    try {
      await enqueueEvent(claimed._id.toString(), claimed.publishAttempts);
    } catch (error) {
      await OutboxEvent.updateOne(
        { _id: claimed._id, status: "queued" },
        { $set: { status: "failed", lastError: error.message, nextAttemptAt: new Date(Date.now() + 60_000) } },
      );
    }
  }
}

async function monitorOutboxEvents(now = new Date()) {
  const staleBefore = new Date(now.getTime() - 15 * 60_000);
  const recovered = await OutboxEvent.updateMany(
    { status: "queued", updatedAt: { $lte: staleBefore } },
    { $set: { status: "failed", lastError: "Outbox queue claim expired", nextAttemptAt: now } },
  );
  const stuck = await OutboxEvent.countDocuments({ status: { $in: ["pending", "queued", "failed"] }, updatedAt: { $lte: staleBefore } });
  if (recovered.modifiedCount) logger.warn({ event: "outbox_events_recovered", count: recovered.modifiedCount }, "Recovered stale outbox events");
  if (stuck) logger.error({ alert: true, event: "outbox_events_stuck", count: stuck }, "Outbox has stuck events");
  return stuck;
}

module.exports = { dispatchOutboxEvents, monitorOutboxEvents, recordOutboxEvent };
