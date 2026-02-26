const http = require("http");
const mongoose = require("mongoose");
const app = require("./app");
const { connectDB } = require("./config/db");
const { env } = require("./config/env");
const { initRateLimitStore } = require("./middlewares/rateLimiters");

const server = http.createServer(app);

async function bootstrap() {
  await connectDB();
  await initRateLimitStore();
  console.log("SMTP:", env.smtpHost || "not set — emails disabled");
  console.log("Redis:", env.redisUrl || "not set — in-memory rate limiting");
  server.listen(env.port, () => console.log(`${env.appName} running on port ${env.port}`));
}

process.on("SIGINT", async () => { server.close(); await mongoose.connection.close(false); process.exit(0); });
process.on("SIGTERM", async () => { server.close(); await mongoose.connection.close(false); process.exit(0); });

bootstrap().catch((err) => { console.error("Bootstrap failed:", err.message); process.exit(1); });
