const IORedis = require("ioredis");
const { env } = require("./env");
const logger = require("./logger");

let queueRedis = null;

function getQueueRedis() {
  if (!env.queueRedisUrl) return null;
  if (queueRedis) return queueRedis;

  queueRedis = new IORedis(env.queueRedisUrl, {
    maxRetriesPerRequest: null,
  });
  queueRedis.on("error", (error) => logger.error({ err: error, event: "email_queue_redis_error" }, "Email queue Redis error"));
  return queueRedis;
}

async function closeQueueRedis() {
  if (!queueRedis) return;
  await queueRedis.quit().catch(() => queueRedis.disconnect());
  queueRedis = null;
}

module.exports = { closeQueueRedis, getQueueRedis };
