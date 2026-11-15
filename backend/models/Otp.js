const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    otp: { type: String, required: true },
    purpose: { type: String, enum: ["register", "forgot", "password-reset", "registration-verified", "twofactor-login", "twofactor-enable", "twofactor-challenge"], required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// Expired OTPs and one-time 2FA challenge nonces are safe to purge automatically.
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Otp", otpSchema);
