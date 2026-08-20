const IORedis = require("ioredis");
const { env } = require("./env");

let queueRedis = null;

function getQueueRedis() {
  if (!env.queueRedisUrl) return null;
  if (queueRedis) return queueRedis;

  queueRedis = new IORedis(env.queueRedisUrl, {
    maxRetriesPerRequest: null,
  });
  queueRedis.on("error", (error) => console.error("Email queue Redis error:", error.message));
  return queueRedis;
}

async function closeQueueRedis() {
  if (!queueRedis) return;
  await queueRedis.quit().catch(() => queueRedis.disconnect());
  queueRedis = null;
}

module.exports = { closeQueueRedis, getQueueRedis };
