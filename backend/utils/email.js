const nodemailer = require("nodemailer");

// Configure your SMTP settings here
const transporter = nodemailer.createTransport({
  service: "gmail", // or your email provider
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmail(to, subject, text, html) {
  const mailOptions = {
    from: process.env.SMTP_USER,
    to,
    subject,
    text,
    html: html || text,
  };
  return transporter.sendMail(mailOptions);
}

module.exports = { sendEmail };
