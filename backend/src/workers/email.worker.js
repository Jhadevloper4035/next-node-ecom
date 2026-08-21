const { Worker } = require("bullmq");
const { env } = require("../config/env");
const { sendMail } = require("../config/mailer");
const { getQueueRedis } = require("../config/queueRedis");
const EmailEvent = require("../models/emailEvent.model");
const { emailEventReady } = require("../services/email-event.service");
const { verificationEmailTemplate, passwordResetEmailTemplate, passwordChangedEmailTemplate, orderReservedEmailTemplate, paymentFailedEmailTemplate, checkoutExpiredEmailTemplate, orderConfirmedEmailTemplate, refundInitiatedEmailTemplate, refundCompletedEmailTemplate, refundFailedEmailTemplate, duplicatePaymentResolvedSupportEmailTemplate } = require("../utils/emailTemplates");

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
    case "orderReserved":
      return {
        subject: `${env.appName} order reserved - payment pending`,
        html: orderReservedEmailTemplate({ ...data, orderUrl: `${env.frontendUrl}/my-account-orders-details?order_id=${encodeURIComponent(data.order.orderNumber)}` }),
      };
    case "paymentFailed":
      return {
        subject: `${env.appName} order is waiting for payment`,
        html: paymentFailedEmailTemplate({ ...data, orderUrl: `${env.frontendUrl}/my-account-orders-details?order_id=${encodeURIComponent(data.order.orderNumber)}` }),
      };
    case "checkoutExpired":
      return {
        subject: `${env.appName} checkout reservation ended`,
        html: checkoutExpiredEmailTemplate(data),
      };
    case "orderConfirmed":
      return {
        subject: `${env.appName} order confirmed`,
        html: orderConfirmedEmailTemplate({
          ...data,
          payment: data.attempt,
          supportEmail: env.supportEmail,
          orderUrl: `${env.frontendUrl}/my-account-orders-details?order_id=${encodeURIComponent(data.order.orderNumber)}`,
        }),
      };
    case "refundInitiated":
      return { subject: `${env.appName} refund initiated`, html: refundInitiatedEmailTemplate(data) };
    case "refundCompleted":
      return { subject: `${env.appName} refund completed`, html: refundCompletedEmailTemplate(data) };
    case "duplicatePaymentResolvedSupport":
      return { subject: `${env.appName} duplicate payment refunded`, html: duplicatePaymentResolvedSupportEmailTemplate(data) };
    case "refundFailed":
      return { subject: `${env.appName} refund needs attention`, html: refundFailedEmailTemplate(data) };
    default:
      throw new Error(`Unsupported email type: ${type}`);
  }
}

async function sendEmailEvent(emailEventId) {
  const emailEvent = await EmailEvent.findOneAndUpdate(
    { _id: emailEventId, status: { $in: ["pending", "queued", "failed"] } },
    { $set: { status: "sending", lastAttemptAt: new Date(), finalError: "" }, $inc: { attemptCount: 1 } },
    { new: true },
  );
  if (!emailEvent) return false;
  if (!(await emailEventReady(emailEvent))) {
    await EmailEvent.updateOne({ _id: emailEvent._id, status: "sending" }, { $set: { status: "ignored", finalError: "Email is no longer valid for the current order state" } });
    return false;
  }
  try {
    await sendMail({ to: emailEvent.to, ...buildEmail(emailEvent.type, emailEvent.data) });
    await EmailEvent.updateOne({ _id: emailEvent._id, status: "sending" }, { $set: { status: "sent", sentAt: new Date(), finalError: "" } });
    return true;
  } catch (error) {
    await EmailEvent.updateOne({ _id: emailEvent._id, status: "sending" }, { $set: { status: "failed", finalError: error.message } });
    throw error;
  }
}

function startEmailWorker() {
  const connection = getQueueRedis();
  if (!connection) {
    console.error("ALERT: Email worker is inactive because the Redis queue is unavailable.");
    return null;
  }
  if (emailWorker) return emailWorker;

  emailWorker = new Worker("email", async (job) => {
    if (job.data.emailEventId) return sendEmailEvent(job.data.emailEventId);
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

module.exports = { buildEmail, closeEmailWorker, sendEmailEvent, startEmailWorker };
