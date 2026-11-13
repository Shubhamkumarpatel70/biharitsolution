const mongoose = require("mongoose");

const privacyRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, enum: ["access", "correction", "erasure", "grievance"], required: true },
  details: { type: String, required: true, trim: true, maxlength: 4000 },
  status: { type: String, enum: ["submitted", "in_review", "awaiting_user", "completed", "rejected"], default: "submitted", index: true },
  response: { type: String, default: "", maxlength: 4000 },
  dueAt: { type: Date, default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), index: true },
  identityVerifiedAt: { type: Date, default: null },
  identityVerifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  decision: { type: String, enum: ["pending", "approved", "partially_approved", "declined"], default: "pending" },
  resolutionAction: { type: String, enum: ["not_started", "provided", "corrected", "erased", "anonymized", "retained_partially", "not_applicable"], default: "not_started" },
  retentionReason: { type: String, default: "", maxlength: 2000 },
  internalNotes: { type: String, default: "", maxlength: 4000 },
  resolvedAt: { type: Date, default: null },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  userNotifiedAt: { type: Date, default: null },
  statusHistory: [{
    status: { type: String, required: true },
    note: { type: String, default: "" },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    changedAt: { type: Date, default: Date.now }
  }],
  adminAudit: [{
    action: { type: String, required: true },
    note: { type: String, default: "" },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    changedAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

privacyRequestSchema.index({ createdAt: -1 });
privacyRequestSchema.index({ status: 1, dueAt: 1 });
module.exports = mongoose.model("PrivacyRequest", privacyRequestSchema);
