const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    otp: { type: String, required: true },
    purpose: { type: String, enum: ["register", "forgot", "password-reset", "twofactor-login", "twofactor-enable"], required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Otp", otpSchema);
