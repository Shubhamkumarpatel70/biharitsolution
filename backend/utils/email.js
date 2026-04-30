const { Resend } = require('resend');

// Initialize Resend with the API key (stored in SMTP_PASS)
const resend = new Resend(process.env.SMTP_PASS);

async function sendEmail(to, subject, text, html, from) {
  try {
    const { data, error } = await resend.emails.send({
      from: from || process.env.SMTP_FROM,
      to,
      subject,
      text: text || "",
      html: html || text || "",
    });

    if (error) {
      console.error("RESEND API ERROR:", error);
      throw error;
    }

    console.log("Email sent successfully via Resend API:", data);
    return data;
  } catch (error) {
    console.error("EMAIL ERROR:", error);
    throw error;
  }
}

module.exports = { sendEmail };
