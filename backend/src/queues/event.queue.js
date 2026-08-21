const { Queue } = require("bullmq");
const { getQueueRedis } = require("../config/queueRedis");

const eventJobOptions = {
  attempts: 5,
  backoff: { type: "exponential", delay: 1000 },
  removeOnComplete: { count: 1000 },
  removeOnFail: { count: 1000 },
};

let eventQueue = null;

function eventJobId(eventId, attempt) {
  return `outbox-${eventId}-${attempt}`;
}

function getEventQueue() {
  const connection = getQueueRedis();
  if (!connection) return null;
  if (!eventQueue) eventQueue = new Queue("domain-events", { connection, defaultJobOptions: eventJobOptions });
  return eventQueue;
}

async function enqueueEvent(eventId, attempt) {
  const queue = getEventQueue();
  if (!queue) throw new Error("Domain event queue is unavailable");
  return queue.add("outbox", { eventId }, { jobId: eventJobId(eventId, attempt) });
}

async function closeEventQueue() {
  if (!eventQueue) return;
  await eventQueue.close();
  eventQueue = null;
}

module.exports = { closeEventQueue, enqueueEvent, eventJobId, eventJobOptions, getEventQueue };
