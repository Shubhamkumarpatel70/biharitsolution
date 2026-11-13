const nodemailer = require("nodemailer");
const { Resend } = require("resend");

let smtpTransporter;

function getResendApiKey() {
  // RESEND_API_KEY is preferred. Keep backward compatibility with deployments
  // that previously stored a Resend key in SMTP_PASS.
  const configuredKey = process.env.RESEND_API_KEY;
  if (configuredKey && configuredKey.trim()) return configuredKey.trim();

  const legacyKey = process.env.SMTP_PASS || "";
  return legacyKey.startsWith("re_") ? legacyKey : "";
}

function getSmtpTransporter() {
  if (smtpTransporter) return smtpTransporter;

  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number.parseInt(process.env.SMTP_PORT || "465", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    throw new Error(
      "Email service is not configured. Set RESEND_API_KEY or SMTP_USER and SMTP_PASS in the backend environment."
    );
  }

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error("SMTP_PORT must be a valid port number.");
  }

  smtpTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 30000,
  });

  return smtpTransporter;
}

async function sendEmail(to, subject, text, html, from) {
  const recipients = Array.isArray(to) ? to : [to];
  if (!recipients.length || recipients.some((recipient) => !recipient)) {
    throw new Error("A valid email recipient is required.");
  }

  const resendApiKey = getResendApiKey();
  if (resendApiKey) {
    const resend = new Resend(resendApiKey);
    const sender =
      process.env.RESEND_FROM ||
      process.env.SMTP_FROM ||
      from;

    if (!sender) {
      throw new Error(
        "RESEND_FROM or SMTP_FROM must contain a verified sender address."
      );
    }

    const { data, error } = await resend.emails.send({
      from: sender,
      to: recipients,
      subject,
      text: text || "",
      html: html || text || "",
    });

    if (error) {
      console.error("RESEND API ERROR:", error);
      throw new Error(error.message || "Resend rejected the email request.");
    }

    return data;
  }

  const transporter = getSmtpTransporter();
  // For SMTP providers (especially Gmail), the sender must match the
  // authenticated mailbox or an approved alias. Do not force the caller's
  // display-name address over the authenticated account.
  const sender = process.env.SMTP_FROM || process.env.SMTP_USER || from;
  if (!sender) {
    throw new Error("Set SMTP_FROM or SMTP_USER to a valid sender address.");
  }

  try {
    return await transporter.sendMail({
      from: sender,
      to: recipients,
      subject,
      text: text || "",
      html: html || text || "",
    });
  } catch (error) {
    console.error("SMTP EMAIL ERROR:", error);
    throw new Error(error.message || "SMTP provider rejected the email.");
  }
}

module.exports = { sendEmail };
