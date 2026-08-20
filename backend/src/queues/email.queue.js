const { Queue } = require("bullmq");
const { getQueueRedis } = require("../config/queueRedis");

const emailPriority = {
  verification: 1,
  passwordReset: 1,
  passwordChanged: 2,
  orderConfirmed: 2,
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

async function enqueueEmail({ type, to, data, jobId }) {
  const priority = emailPriority[type];
  if (!priority) throw new Error(`Unsupported email type: ${type}`);

  const queue = getEmailQueue();
  if (!queue) {
    console.warn("Email queue disabled because QUEUE_REDIS_URL and REDIS_URL are not set.");
    return null;
  }

  return queue.add(type, { to, data }, { jobId, priority });
}

async function closeEmailQueue() {
  if (!emailQueue) return;
  await emailQueue.close();
  emailQueue = null;
}

module.exports = { closeEmailQueue, emailJobOptions, emailPriority, enqueueEmail };
