const nodemailer = require("nodemailer");

// Configure your SMTP settings here
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: parseInt(process.env.SMTP_PORT || "465") === 465, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendEmail(to, subject, text, html, from) {
  const mailOptions = {
    from: from || process.env.SMTP_FROM || '"AskC Web" <no-reply@askcweb.in>',
    to,
    subject,
    text,
    html: html || text,
  };
  return transporter.sendMail(mailOptions);
}

module.exports = { sendEmail };
