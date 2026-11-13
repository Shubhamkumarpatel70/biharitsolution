const mongoose = require("mongoose");

const privacyConsentEventSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  purpose: { type: String, required: true, enum: ["marketing_emails"] },
  action: { type: String, required: true, enum: ["granted", "withdrawn"] },
  source: { type: String, default: "privacy-centre" },
  policyVersion: { type: String, default: "2026-11" },
  occurredAt: { type: Date, default: Date.now }
}, { timestamps: true });

privacyConsentEventSchema.index({ user: 1, occurredAt: -1 });
module.exports = mongoose.model("PrivacyConsentEvent", privacyConsentEventSchema);
