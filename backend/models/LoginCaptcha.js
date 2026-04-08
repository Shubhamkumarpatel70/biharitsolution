const mongoose = require('mongoose');

const loginCaptchaSchema = new mongoose.Schema(
  {
    answer: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

loginCaptchaSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('LoginCaptcha', loginCaptchaSchema);
