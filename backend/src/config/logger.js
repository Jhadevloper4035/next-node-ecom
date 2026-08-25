const pino = require("pino");

const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "info" : "debug"),
  base: { service: process.env.APP_NAME || "curve-comfort-api" },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.body.password",
      "req.body.currentPassword",
      "req.body.newPassword",
      "req.body.confirmPassword",
      "req.body.token",
      "req.body.accessToken",
      "req.body.refreshToken",
      "req.body.paymentSessionId",
      "req.body.signature",
    ],
    censor: "[REDACTED]",
  },
});

module.exports = logger;
