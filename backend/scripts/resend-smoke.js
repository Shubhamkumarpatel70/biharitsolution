"use strict";

// Sends one real test email. Run manually with a verified sender and consented test mailbox.
require("dotenv").config();
const { sendEmail } = require("../utils/email");

async function main() {
  const recipient = String(process.env.RESEND_TEST_RECIPIENT || "").trim().toLowerCase();
  if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
    throw new Error("Set RESEND_TEST_RECIPIENT to a mailbox you control.");
  }
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured.");
  await sendEmail(
    recipient,
    "ASKC TECHNOLOGIES — Resend delivery test",
    "This is an explicitly requested ASKC TECHNOLOGIES email delivery verification.",
    "<div style='font-family:Arial,sans-serif;padding:24px'><h2>ASKC TECHNOLOGIES</h2><p>This is an explicitly requested Resend delivery verification.</p></div>",
    process.env.RESEND_FROM || '"ASKC TECHNOLOGIES" <askctechnologies@gmail.com>',
  );
  process.stdout.write("Email accepted by configured provider for the supplied test recipient. Check the mailbox and Resend delivery events.\n");
}
main().catch((error) => { process.stderr.write(error.message + "\n"); process.exitCode = 1; });
