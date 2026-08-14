const http = require("http");
const mongoose = require("mongoose");
const app = require("./app");
const { connectDB } = require("./config/db");
const { env } = require("./config/env");
const { closeRedis } = require("./config/redis");
const { initRateLimitStore } = require("./middlewares/rateLimiters");
const { expirePendingOrders } = require("./services/checkout.service");

const server = http.createServer(app);

async function bootstrap() {
  
  await connectDB();
  await initRateLimitStore();
  await expirePendingOrders();
  globalThis.setInterval(() => expirePendingOrders().catch((err) => console.error("Checkout expiry failed:", err.message)), 60_000).unref();
  console.log("SMTP:", env.smtpHost || "not set — emails disabled");
  console.log("Redis:", env.redisUrl || "not set — in-memory rate limiting");
  server.listen(env.port, () => console.log(`${env.appName} running on port ${env.port}`));
}

const shutdown = async () => {
  server.close();
  await Promise.all([
    mongoose.connection.close(false),
    closeRedis(),
  ]);
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

bootstrap().catch((err) => { console.error("Bootstrap failed:", err.message); process.exit(1); });
