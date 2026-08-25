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
const logger = require("./config/logger");

const server = http.createServer(app);
const logBackgroundFailure = (event) => (err) => logger.error({ err, event }, "Background task failed");

async function bootstrap() {
  
  await connectDB();
  await initRateLimitStore();
  startEmailWorker();
  startEventWorker();
  await expirePendingOrders();
  redactExpiredPaymentPayloads().catch(logBackgroundFailure("payment_payload_retention_failed"));
  reconcilePayments().catch(logBackgroundFailure("initial_payment_reconciliation_failed"));
  reconcileRefunds().catch(logBackgroundFailure("initial_refund_reconciliation_failed"));
  dispatchOutboxEvents().catch(logBackgroundFailure("initial_outbox_dispatch_failed"));
  recoverFailedEmailEvents().catch(logBackgroundFailure("initial_email_recovery_failed"));
  globalThis.setInterval(() => expirePendingOrders().catch(logBackgroundFailure("checkout_expiry_failed")), 60_000).unref();
  globalThis.setInterval(() => reconcilePayments().catch(logBackgroundFailure("payment_reconciliation_failed")), 5 * 60_000).unref();
  globalThis.setInterval(() => reconcileRefunds().catch(logBackgroundFailure("refund_reconciliation_failed")), 5 * 60_000).unref();
  globalThis.setInterval(() => dispatchOutboxEvents().catch(logBackgroundFailure("outbox_dispatch_failed")), 60_000).unref();
  globalThis.setInterval(() => monitorOutboxEvents().catch(logBackgroundFailure("outbox_monitor_failed")), 5 * 60_000).unref();
  globalThis.setInterval(() => recoverFailedEmailEvents().catch(logBackgroundFailure("email_recovery_failed")), 5 * 60_000).unref();
  globalThis.setInterval(() => redactExpiredPaymentPayloads().catch(logBackgroundFailure("payment_payload_retention_failed")), 24 * 60 * 60_000).unref();
  server.listen(env.port, () => logger.info({ port: env.port }, "Server started"));
}

const shutdown = async () => {
  logger.info("Shutting down");
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

bootstrap().catch((err) => { logger.fatal({ err, event: "bootstrap_failed" }, "Bootstrap failed"); process.exit(1); });
