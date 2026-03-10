const rateLimit = require("express-rate-limit");
const { env } = require("../config/env");

const MINUTES = (n) => n * 60 * 1000;
let redisStore = null;

async function initRateLimitStore() {
  if (!env.redisUrl) { console.warn("REDIS_URL not set — in-memory rate limiting only."); return; }
  try {
    const { createClient } = require("redis");
    const { RedisStore } = require("rate-limit-redis");
    const client = createClient({ url: env.redisUrl });
    client.on("error", (err) => console.error("Redis error:", err.message));
    await client.connect();
    redisStore = new RedisStore({ sendCommand: (...args) => client.sendCommand(args) });
    console.log("Redis rate-limit store connected.");
  } catch (err) {
    console.warn("Redis unavailable, using in-memory:", err.message);
  }
}

function limiter(windowMinutes, max, message) {
  return rateLimit({ windowMs: MINUTES(windowMinutes), limit: max, standardHeaders: "draft-7", legacyHeaders: false, store: redisStore || undefined, message: { success: false, message, data: null } });
}

const authLimiter = limiter(15, 120, "Too many requests. Please try again later.");
const loginLimiter = limiter(env.loginWindow, env.loginMaxAttempts, "Too many login attempts. Please try again later.");
const otpVerifyLimiter = limiter(env.otpVerifyWindow, env.otpVerifyMaxAttempts, "Too many OTP attempts. Please try again later.");

module.exports = { authLimiter, loginLimiter, otpVerifyLimiter, initRateLimitStore };
