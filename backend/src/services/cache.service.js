const crypto = require("crypto");
const { env } = require("../config/env");
const { getRedisClient } = require("../config/redis");

const VERSION_KEY_PREFIX = `${env.cachePrefix}:version`;

const stableValue = (value) => {
  if (Array.isArray(value)) return value.map(stableValue);

  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        result[key] = stableValue(value[key]);
        return result;
      }, {});
  }

  return value;
};

const stableStringify = (value) => JSON.stringify(stableValue(value));

const withTimeout = async (promise) => {
  let timeout;

  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error("Redis cache operation timed out")),
          env.cacheOperationTimeoutMs,
        );
      }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
};

const versionKey = (namespace) => `${VERSION_KEY_PREFIX}:${namespace}`;

const getNamespaceVersion = async (namespace) => {
  const client = getRedisClient();
  if (!client || !env.cacheEnabled) return null;

  try {
    let version = await withTimeout(client.get(versionKey(namespace)));

    if (!version) {
      await withTimeout(client.set(versionKey(namespace), "1", { NX: true }));
      version = (await withTimeout(client.get(versionKey(namespace)))) || "1";
    }

    return version;
  } catch (error) {
    console.warn("Cache version lookup failed:", error.message);
    return null;
  }
};

const createCacheKey = async (namespace, resource, identity = {}) => {
  const version = await getNamespaceVersion(namespace);
  if (!version) return null;

  const digest = crypto
    .createHash("sha256")
    .update(stableStringify(identity))
    .digest("hex")
    .slice(0, 24);

  return `${env.cachePrefix}:${namespace}:v${version}:${resource}:${digest}`;
};

const getCacheValue = async (key) => {
  const client = getRedisClient();
  if (!client || !key || !env.cacheEnabled) return null;

  try {
    const value = await withTimeout(client.get(key));
    if (!value) return null;
    return JSON.parse(value);
  } catch (error) {
    console.warn("Cache read failed:", error.message);
    return null;
  }
};

const setCacheValue = async (key, value, ttlSeconds) => {
  const client = getRedisClient();
  if (!client || !key || !env.cacheEnabled) return false;

  const baseTtl = Math.max(1, Number(ttlSeconds || env.cacheDefaultTtlSeconds));
  const jitter = Math.floor(baseTtl * Math.random() * 0.1);

  try {
    await withTimeout(
      client.set(key, JSON.stringify(value), { EX: baseTtl + jitter }),
    );
    return true;
  } catch (error) {
    console.warn("Cache write failed:", error.message);
    return false;
  }
};

const invalidateNamespaces = async (namespaces) => {
  const client = getRedisClient();
  if (!client || !env.cacheEnabled) return false;

  try {
    await withTimeout(
      Promise.all([...new Set(namespaces)].map((namespace) => client.incr(versionKey(namespace)))),
    );
    return true;
  } catch (error) {
    console.warn("Cache invalidation failed:", error.message);
    return false;
  }
};

module.exports = {
  createCacheKey,
  getCacheValue,
  invalidateNamespaces,
  setCacheValue,
  stableStringify,
};
