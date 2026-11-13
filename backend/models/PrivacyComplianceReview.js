const mongoose = require("mongoose");

const CHECKLIST = [
  "data_inventory", "purpose_and_minimisation", "notice_and_transparency",
  "consent_and_withdrawal", "user_rights_requests", "children_and_guardians",
  "security_and_access", "processor_contracts", "retention_and_erasure",
  "breach_readiness", "grievance_redressal", "logs_and_records",
  "policy_and_notices", "staff_awareness"
];

const itemSchema = new mongoose.Schema({
  key: { type: String, enum: CHECKLIST, required: true },
  completed: { type: Boolean, default: false },
  evidence: { type: String, trim: true, maxlength: 2000, default: "" },
  notes: { type: String, trim: true, maxlength: 2000, default: "" },
  checkedAt: { type: Date, default: null }
}, { _id: false });

const auditSchema = new mongoose.Schema({
  action: { type: String, required: true, maxlength: 80 },
  note: { type: String, maxlength: 1000, default: "" },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  occurredAt: { type: Date, default: Date.now }
}, { _id: false });

const monthlySchema = new mongoose.Schema({
  month: { type: String, required: true, match: /^\\d{4}-(0[1-9]|1[0-2])$/ },
  items: { type: [itemSchema], default: [] },
  status: { type: String, enum: ["in_progress", "ready_for_review", "completed"], default: "in_progress" },
  reviewer: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  reviewedAt: { type: Date, default: null },
  summary: { type: String, trim: true, maxlength: 4000, default: "" },
  auditHistory: { type: [auditSchema], default: [] }
}, { timestamps: true });

monthlySchema.index({ month: 1 }, { unique: true });
module.exports = mongoose.model("PrivacyComplianceReview", monthlySchema);
