const { createClient } = require("redis");
const { env } = require("./env");

let redisClient = null;
let initialization = null;
let lastLoggedError = "";
let lastLoggedAt = 0;

const logRedisError = (error) => {
  const message = error?.message || String(error);
  const now = Date.now();

  if (message !== lastLoggedError || now - lastLoggedAt > 30000) {
    console.error("Redis error:", message);
    lastLoggedError = message;
    lastLoggedAt = now;
  }
};

const initRedis = async () => {
  if (!env.redisUrl) {
    console.warn("REDIS_URL not set — Redis features disabled.");
    return null;
  }

  if (redisClient?.isReady) return redisClient;
  if (initialization) return initialization;

  redisClient = createClient({
    url: env.redisUrl,
    disableOfflineQueue: true,
    socket: {
      connectTimeout: 3000,
      reconnectStrategy: (retries) => Math.min(100 * 2 ** retries, 3000),
    },
  });

  redisClient.on("error", logRedisError);

  initialization = redisClient
    .connect()
    .then(() => redisClient)
    .catch((error) => {
      logRedisError(error);
      return null;
    })
    .finally(() => {
      initialization = null;
    });

  return initialization;
};

const getRedisClient = () => (redisClient?.isReady ? redisClient : null);

const closeRedis = async () => {
  if (!redisClient?.isOpen) return;

  try {
    await redisClient.quit();
  } catch {
    redisClient.disconnect();
  }
};

module.exports = {
  closeRedis,
  getRedisClient,
  initRedis,
};
