require("dotenv").config();
const { URL } = require("node:url");

function need(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function validateProductionPaymentConfig(config) {
  if (config.nodeEnv !== "production") return;
  if (!config.cashfreeClientId || !config.cashfreeClientSecret) throw new Error("Production requires Cashfree credentials");
  if (config.cashfreeEnvironment !== "production") throw new Error("Production requires CASHFREE_ENVIRONMENT=production");
  if (!isHttpsUrl(config.cashfreeWebhookUrl)) throw new Error("Production requires an HTTPS CASHFREE_WEBHOOK_URL");
  if (!isHttpsUrl(config.frontendUrl)) throw new Error("Production requires an HTTPS FRONTEND_URL");
  if (!config.supportEmail) throw new Error("Production requires SUPPORT_EMAIL");
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  appName: process.env.APP_NAME || "ecom",
  apiPrefix: process.env.API_PREFIX || "/api/v1",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

  mongoUri: need("MONGODB_URI"),
  redisUrl: process.env.REDIS_URL || null,
  queueRedisUrl: process.env.QUEUE_REDIS_URL || process.env.REDIS_URL || null,
  cacheEnabled: process.env.CACHE_ENABLED !== "false" && Boolean(process.env.REDIS_URL),
  cachePrefix: process.env.CACHE_PREFIX || "curve-comfort:v1",
  cacheDefaultTtlSeconds: Number(process.env.CACHE_DEFAULT_TTL_SECONDS || 300),
  cacheProductListTtlSeconds: Number(process.env.CACHE_PRODUCT_LIST_TTL_SECONDS || 60),
  cacheProductTtlSeconds: Number(process.env.CACHE_PRODUCT_TTL_SECONDS || 300),
  cacheCategoryTtlSeconds: Number(process.env.CACHE_CATEGORY_TTL_SECONDS || 600),
  cacheOperationTimeoutMs: Number(process.env.CACHE_OPERATION_TIMEOUT_MS || 100),

  corsOrigin: (process.env.CORS_ORIGIN || "").split(",").map(s => s.trim()).filter(Boolean),
  corsCredentials: process.env.CORS_CREDENTIALS !== "false",
  trustProxy: process.env.TRUST_PROXY === "true",

  jwtAccessSecret: need("JWT_ACCESS_SECRET"),
  jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  refreshTokenDays: Number(process.env.REFRESH_TOKEN_DAYS || 7),
  maxSessions: Number(process.env.MAX_SESSIONS || 10),

  cookieName: process.env.COOKIE_NAME || "refreshToken",
  accessCookieName: process.env.ACCESS_COOKIE_NAME || "accessToken",
  cookieSecure: process.env.COOKIE_SECURE === "true",
  cookieSameSite: process.env.COOKIE_SAMESITE || "strict",
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
  cookiePath: process.env.COOKIE_PATH || "/api/v1/auth",
  accessCookiePath: process.env.ACCESS_COOKIE_PATH || "/api/v1",

  cashfreeClientId: process.env.CASHFREE_CLIENT_ID || "",
  cashfreeClientSecret: process.env.CASHFREE_CLIENT_SECRET || "",
  cashfreeEnvironment: process.env.CASHFREE_ENVIRONMENT || "sandbox",
  cashfreeApiVersion: process.env.CASHFREE_API_VERSION || "2025-01-01",
  cashfreeWebhookUrl: process.env.CASHFREE_WEBHOOK_URL || "",
  cashfreeWebhookToleranceSeconds: Math.max(Number(process.env.CASHFREE_WEBHOOK_TOLERANCE_SECONDS || 300), 30),
  paymentPayloadRetentionDays: Math.max(Number(process.env.PAYMENT_PAYLOAD_RETENTION_DAYS || 90), 1),
  // Cashfree requires an expiry strictly greater than 15 minutes.
  checkoutExpiryMinutes: Math.max(Number(process.env.CHECKOUT_EXPIRY_MINUTES || 16), 16),
  pendingPaymentReviewMinutes: Math.max(Number(process.env.PENDING_PAYMENT_REVIEW_MINUTES || 10), 1),

  verificationExpiry: Number(process.env.VERIFICATION_EXPIRES_MINUTES || 30),

  loginMaxAttempts: Number(process.env.LOGIN_MAX_ATTEMPTS || 8),
  loginWindow: Number(process.env.LOGIN_WINDOW_MINUTES || 15),
  accountLockMinutes: Number(process.env.ACCOUNT_LOCK_MINUTES || 15),

  smtpHost: process.env.SMTP_HOST,
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpSecure: process.env.SMTP_SECURE === "true",
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  mailFrom: process.env.MAIL_FROM || `"${process.env.APP_NAME || "NodeAuthMVC"}" <no-reply@example.com>`,
  supportEmail: process.env.SUPPORT_EMAIL || "",

};

validateProductionPaymentConfig(env);

module.exports = { env, validateProductionPaymentConfig };
