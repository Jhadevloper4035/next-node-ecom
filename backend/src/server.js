const http = require("http");
const mongoose = require("mongoose");
const app = require("./app");
const { connectDB } = require("./config/db");
const { env } = require("./config/env");
const { closeRedis } = require("./config/redis");
const { closeQueueRedis } = require("./config/queueRedis");
const { closeEmailQueue } = require("./queues/email.queue");
const { closeEventQueue } = require("./queues/event.queue");
const { closeEmailWorker, startEmailWorker } = require("./workers/email.worker");
const { closeEventWorker, startEventWorker } = require("./workers/event.worker");
const { initRateLimitStore } = require("./middlewares/rateLimiters");
const { expirePendingOrders } = require("./services/checkout.service");
const { reconcilePayments } = require("./services/payment-reconciliation.service");
const { reconcileRefunds } = require("./services/refund.service");
const { dispatchOutboxEvents, monitorOutboxEvents } = require("./services/outbox.service");
const { recoverFailedEmailEvents } = require("./services/email-event.service");
const { redactExpiredPaymentPayloads } = require("./services/payment-data-retention.service");

const server = http.createServer(app);

async function bootstrap() {
  
  await connectDB();
  await initRateLimitStore();
  startEmailWorker();
  startEventWorker();
  await expirePendingOrders();
  redactExpiredPaymentPayloads().catch(() => console.error("Payment payload retention failed"));
  reconcilePayments().catch((err) => console.error("Initial payment reconciliation failed:", err.message));
  reconcileRefunds().catch((err) => console.error("Initial refund reconciliation failed:", err.message));
  dispatchOutboxEvents().catch((err) => console.error("Initial outbox dispatch failed:", err.message));
  recoverFailedEmailEvents().catch((err) => console.error("Initial email recovery failed:", err.message));
  globalThis.setInterval(() => expirePendingOrders().catch((err) => console.error("Checkout expiry failed:", err.message)), 60_000).unref();
  globalThis.setInterval(() => reconcilePayments().catch((err) => console.error("Payment reconciliation failed:", err.message)), 5 * 60_000).unref();
  globalThis.setInterval(() => reconcileRefunds().catch((err) => console.error("Refund reconciliation failed:", err.message)), 5 * 60_000).unref();
  globalThis.setInterval(() => dispatchOutboxEvents().catch((err) => console.error("Outbox dispatch failed:", err.message)), 60_000).unref();
  globalThis.setInterval(() => monitorOutboxEvents().catch((err) => console.error("Outbox monitor failed:", err.message)), 5 * 60_000).unref();
  globalThis.setInterval(() => recoverFailedEmailEvents().catch((err) => console.error("Email recovery failed:", err.message)), 5 * 60_000).unref();
  globalThis.setInterval(() => redactExpiredPaymentPayloads().catch(() => console.error("Payment payload retention failed")), 24 * 60 * 60_000).unref();
  server.listen(env.port);
}

const shutdown = async () => {
  server.close();
  await Promise.all([closeEmailWorker(), closeEventWorker(), closeEmailQueue(), closeEventQueue()]);
  await Promise.all([
    mongoose.connection.close(false),
    closeRedis(),
    closeQueueRedis(),
  ]);
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

bootstrap().catch((err) => { console.error("Bootstrap failed:", err.message); process.exit(1); });
