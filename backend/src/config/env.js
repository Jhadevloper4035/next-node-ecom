require("dotenv").config();

function need(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

const env = {
  nodeEnv:     process.env.NODE_ENV  || "development",
  port:        Number(process.env.PORT || 5000),
  appName:     process.env.APP_NAME  || "ecom",
  apiPrefix:   process.env.API_PREFIX || "/api/v1",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",

  mongoUri: need("MONGODB_URI"),
  redisUrl: process.env.REDIS_URL || null,

  corsOrigin:      (process.env.CORS_ORIGIN || "").split(",").map(s => s.trim()).filter(Boolean),
  corsCredentials: process.env.CORS_CREDENTIALS !== "false",
  trustProxy:      process.env.TRUST_PROXY === "true",

  jwtAccessSecret:   need("JWT_ACCESS_SECRET"),
  jwtRefreshSecret:  need("JWT_REFRESH_SECRET"),
  jwtAccessExpiry:   process.env.JWT_ACCESS_EXPIRES_IN  || "15m",
  jwtRefreshExpiry:  process.env.JWT_REFRESH_EXPIRES_IN || "7d",

  cookieName:    process.env.COOKIE_NAME     || "refreshToken",
  cookieSecure:  process.env.COOKIE_SECURE   === "true",
  cookieSameSite: process.env.COOKIE_SAMESITE || "lax",
  cookieDomain:  process.env.COOKIE_DOMAIN   || undefined,
  cookiePath:    process.env.COOKIE_PATH      || "/api/v1/auth",

  otpExpiry:    Number(process.env.OTP_EXPIRES_MINUTES       || 10),
  otpMaxReqs:   Number(process.env.OTP_MAX_REQUESTS          || 3),
  otpWindow:    Number(process.env.OTP_WINDOW_MINUTES        || 15),
  otpCooldown:  Number(process.env.OTP_RESEND_COOLDOWN_SECONDS || 60),

  loginMaxAttempts:    Number(process.env.LOGIN_MAX_ATTEMPTS        || 8),
  loginWindow:         Number(process.env.LOGIN_WINDOW_MINUTES      || 15),
  otpVerifyMaxAttempts: Number(process.env.OTP_VERIFY_MAX_ATTEMPTS  || 8),
  otpVerifyWindow:      Number(process.env.OTP_VERIFY_WINDOW_MINUTES || 15),

  smtpHost:   process.env.SMTP_HOST,
  smtpPort:   Number(process.env.SMTP_PORT || 587),
  smtpSecure: process.env.SMTP_SECURE === "true",
  smtpUser:   process.env.SMTP_USER,
  smtpPass:   process.env.SMTP_PASS,
  mailFrom:   process.env.MAIL_FROM || `"${process.env.APP_NAME || "NodeAuthMVC"}" <no-reply@example.com>`,

  returnRefreshInBody: process.env.RETURN_REFRESH_TOKEN_IN_BODY === "true",
};

module.exports = { env };
