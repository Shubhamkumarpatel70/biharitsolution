const nodemailer = require("nodemailer");
const dns = require("dns");
dns.setDefaultResultOrder("ipv4first");

const port = Number(process.env.SMTP_PORT);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port,
  secure: port === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  family: 4, // Force IPv4 to fix ENETUNREACH IPv6 routing errors
  connectionTimeout: 5000, // 5 seconds
  greetingTimeout: 5000,
  socketTimeout: 5000,
});

async function sendEmail(to, subject, text, html, from) {
  try {
    const info = await transporter.sendMail({
      from: from || process.env.SMTP_FROM,
      to,
      subject,
      text,
      html: html || text,
    });

    console.log("Email sent:", info.response);
    return info;
  } catch (error) {
    console.error("EMAIL ERROR:", error);
    throw error;
  }
}

module.exports = { sendEmail };
