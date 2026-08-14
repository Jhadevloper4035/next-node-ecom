const rateLimit = require("express-rate-limit");
const { env } = require("../config/env");
const { initRedis } = require("../config/redis");

const MINUTES = (n) => n * 60 * 1000;
let redisStore = null;

async function initRateLimitStore() {
  if (!env.redisUrl) {
    console.warn("REDIS_URL not set — in-memory rate limiting only.");
    return;
  }

  try {
    const { RedisStore } = require("rate-limit-redis");
    const client = await initRedis();
    if (!client) return;

    redisStore = new RedisStore({ sendCommand: (...args) => client.sendCommand(args) });
    console.log("Redis rate-limit store connected.");
  } catch (err) {
    console.warn("Redis unavailable, using in-memory:", err.message);
  }
}

function limiter(windowMinutes, max, message, keyGenerator) {
  return rateLimit({ windowMs: MINUTES(windowMinutes), limit: max, standardHeaders: "draft-7", legacyHeaders: false, store: redisStore || undefined, message: { success: false, message, data: null }, keyGenerator });
}

const lazyLimiter = (...options) => {
  let middleware = null;
  return (req, res, next) => {
    if (!middleware) middleware = limiter(...options);
    return middleware(req, res, next);
  };
};

const authLimiter = lazyLimiter(15, 120, "Too many requests. Please try again later.");
const loginLimiter = lazyLimiter(env.loginWindow, env.loginMaxAttempts, "Too many login attempts. Please try again later.");
const loginEmailLimiter = lazyLimiter(env.loginWindow, env.loginMaxAttempts, "Too many login attempts. Please try again later.", (req) => `email:${String(req.body?.email || "").toLowerCase()}`);
const checkoutLimiter = lazyLimiter(10, 10, "Too many checkout attempts. Please try again later.", (req) => `user:${req.user?.id || req.ip}`);

module.exports = { authLimiter, loginLimiter, loginEmailLimiter, checkoutLimiter, initRateLimitStore };
