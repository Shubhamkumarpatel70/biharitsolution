const mongoose = require("mongoose");

const privacyRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, enum: ["access", "correction", "erasure", "grievance"], required: true },
  details: { type: String, required: true, trim: true, maxlength: 4000 },
  status: { type: String, enum: ["submitted", "in_review", "awaiting_user", "completed", "rejected"], default: "submitted", index: true },
  response: { type: String, default: "", maxlength: 4000 },
  statusHistory: [{
    status: { type: String, required: true },
    note: { type: String, default: "" },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    changedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

privacyRequestSchema.index({ createdAt: -1 });
module.exports = mongoose.model("PrivacyRequest", privacyRequestSchema);
