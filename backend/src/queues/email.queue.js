const { Queue } = require("bullmq");
const { getQueueRedis } = require("../config/queueRedis");
const logger = require("../config/logger");

const emailPriority = {
  verification: 1,
  passwordReset: 1,
  passwordChanged: 2,
  orderReserved: 2,
  paymentFailed: 2,
  checkoutExpired: 2,
  orderConfirmed: 2,
  refundInitiated: 2,
  refundCompleted: 2,
  duplicatePaymentResolvedSupport: 1,
  refundFailed: 1,
};

const emailJobOptions = {
  attempts: 5,
  backoff: { type: "exponential", delay: 1000 },
  removeOnComplete: { count: 1000 },
  removeOnFail: { count: 1000 },
};

let emailQueue = null;

function getEmailQueue() {
  const connection = getQueueRedis();
  if (!connection) return null;
  if (emailQueue) return emailQueue;

  emailQueue = new Queue("email", {
    connection,
    defaultJobOptions: emailJobOptions,
  });
  return emailQueue;
}

async function enqueueEmail({ type, to, data, jobId, emailEventId }, { requireQueue = false } = {}) {
  const priority = emailPriority[type];
  if (!priority) throw new Error(`Unsupported email type: ${type}`);

  const queue = getEmailQueue();
  if (!queue) {
    if (requireQueue) {
      logger.error({ alert: true, event: "email_queue_unavailable" }, "Email queue is unavailable");
      throw new Error("Email queue is unavailable");
    }
    logger.warn({ event: "email_queue_disabled" }, "Email queue disabled because Redis is not configured");
    return null;
  }

  try {
    return await queue.add(type, { to, data, emailEventId }, { jobId, priority });
  } catch (error) {
    logger.error({ err: error, alert: true, event: "email_queue_enqueue_failed", emailEventId }, "Email queue enqueue failed");
    if (requireQueue) throw error;
    return null;
  }
}

async function closeEmailQueue() {
  if (!emailQueue) return;
  await emailQueue.close();
  emailQueue = null;
}

module.exports = { closeEmailQueue, emailJobOptions, emailPriority, enqueueEmail, getEmailQueue };
