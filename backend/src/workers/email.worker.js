const { Worker } = require("bullmq");
const { env } = require("../config/env");
const { sendMail } = require("../config/mailer");
const { getQueueRedis } = require("../config/queueRedis");
const { verificationEmailTemplate, passwordResetEmailTemplate, passwordChangedEmailTemplate, orderConfirmedEmailTemplate } = require("../utils/emailTemplates");

let emailWorker = null;

function buildEmail(type, data = {}) {
  switch (type) {
    case "verification":
      return {
        subject: "Curve & Comfort - Verify your email",
        html: verificationEmailTemplate(data),
      };
    case "passwordReset":
      return {
        subject: "Curve & Comfort - Reset your password",
        html: passwordResetEmailTemplate(data),
      };
    case "passwordChanged":
      return {
        subject: "Curve & Comfort - Password changed",
        html: passwordChangedEmailTemplate(),
      };
    case "orderConfirmed":
      return {
        subject: `${env.appName} order confirmed`,
        html: orderConfirmedEmailTemplate(data),
      };
    default:
      throw new Error(`Unsupported email type: ${type}`);
  }
}

function startEmailWorker() {
  const connection = getQueueRedis();
  if (!connection || emailWorker) return emailWorker;

  emailWorker = new Worker("email", async (job) => {
    const email = buildEmail(job.name, job.data.data);
    await sendMail({ to: job.data.to, ...email });
  }, { connection });

  emailWorker.on("completed", (job) => console.log(`Email job ${job.id} sent.`));
  emailWorker.on("failed", (job, error) => console.error(`Email job ${job?.id || "unknown"} failed:`, error.message));
  return emailWorker;
}

async function closeEmailWorker() {
  if (!emailWorker) return;
  await emailWorker.close();
  emailWorker = null;
}

module.exports = { buildEmail, closeEmailWorker, startEmailWorker };
