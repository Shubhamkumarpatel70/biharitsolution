require("dotenv").config();
const nodemailer = require("nodemailer");

console.log("Host:", process.env.SMTP_HOST);
console.log("Port:", process.env.SMTP_PORT);
console.log("User:", process.env.SMTP_USER);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: parseInt(process.env.SMTP_PORT || "465") === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  debug: true, // show debug output
  logger: true // log information in console
});

transporter.verify(function (error, success) {
  if (error) {
    console.error("Connection Error:", error);
  } else {
    console.log("Server is ready to take our messages");
  }
});
