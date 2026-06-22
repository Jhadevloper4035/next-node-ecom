const { env } = require("../config/env");
const {
  createCacheKey,
  getCacheValue,
  setCacheValue,
} = require("../services/cache.service");

const cacheResponse = ({ namespace, resource, ttlSeconds }) => async (req, res, next) => {
  if (!env.cacheEnabled || req.method !== "GET") {
    res.set("X-Cache", "BYPASS");
    return next();
  }

  const key = await createCacheKey(namespace, resource, {
    params: req.params,
    query: req.query,
  });

  if (!key) {
    res.set("X-Cache", "BYPASS");
    return next();
  }

  const cached = await getCacheValue(key);
  if (cached) {
    res.set("X-Cache", "HIT");
    return res.status(200).json(cached);
  }

  res.set("X-Cache", "MISS");
  const sendJson = res.json.bind(res);

  res.json = (body) => {
    if (res.statusCode === 200 && body?.success !== false) {
      void setCacheValue(key, body, ttlSeconds);
    }

    return sendJson(body);
  };

  return next();
};

module.exports = cacheResponse;
