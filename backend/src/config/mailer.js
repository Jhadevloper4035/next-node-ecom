const nodemailer = require("nodemailer");
const { env } = require("./env");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!env.smtpHost) return null;

  const config = { host: env.smtpHost, port: env.smtpPort, secure: env.smtpSecure };
  if (env.smtpUser && env.smtpPass) config.auth = { user: env.smtpUser, pass: env.smtpPass };

  transporter = nodemailer.createTransport(config);
  return transporter;
}

async function sendMail({ to, subject, html }) {
  const t = getTransporter();
  if (!t) { console.warn("Email skipped — SMTP_HOST not set:", subject); return; }
  await t.sendMail({ from: env.mailFrom, to, subject, html });
  console.log("Email sent to:", to);
}

module.exports = { sendMail };
