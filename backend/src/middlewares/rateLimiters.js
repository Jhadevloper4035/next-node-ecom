const rateLimit = require("express-rate-limit");
const { env } = require("../config/env");
const { initRedis } = require("../config/redis");

const MINUTES = (minutes) => minutes * 60 * 1000;

function createLimiters(createStore = () => undefined) {
  const limiter = (name, windowMinutes, limit, message, keyGenerator) => rateLimit({
    windowMs: MINUTES(windowMinutes), limit, standardHeaders: "draft-7", legacyHeaders: false,
    store: createStore(name), message: { success: false, message, data: null }, keyGenerator,
  });
  return {
    auth: limiter("auth", 15, 120, "Too many requests. Please try again later."),
    login: limiter("login-ip", env.loginWindow, env.loginMaxAttempts, "Too many login attempts. Please try again later."),
    loginEmail: limiter("login-email", env.loginWindow, env.loginMaxAttempts, "Too many login attempts. Please try again later.", (req) => `email:${String(req.body?.email || "").toLowerCase()}`),
    checkout: limiter("checkout", 10, 10, "Too many checkout attempts. Please try again later.", (req) => `user:${req.user?.id || req.ip}`),
  };
}

let limiters = createLimiters();
const useLimiter = (name) => (req, res, next) => limiters[name](req, res, next);

async function initRateLimitStore() {
  if (!env.redisUrl) return;
  try {
    const { RedisStore } = require("rate-limit-redis");
    const client = await initRedis();
    if (!client) return;
    limiters = createLimiters((name) => new RedisStore({ sendCommand: (...args) => client.sendCommand(args), prefix: `curve-comfort:rate-limit:${name}:` }));
    console.log("Redis rate-limit store connected.");
  } catch (error) {
    console.warn("Redis unavailable, using in-memory:", error.message);
  }
}

module.exports = {
  authLimiter: useLimiter("auth"),
  loginLimiter: useLimiter("login"),
  loginEmailLimiter: useLimiter("loginEmail"),
  checkoutLimiter: useLimiter("checkout"),
  initRateLimitStore,
};
