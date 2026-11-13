const mongoose = require("mongoose");

const auditSchema = new mongoose.Schema({
  action: { type: String, required: true, maxlength: 80 },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  occurredAt: { type: Date, default: Date.now }
}, { _id: false });

const schema = new mongoose.Schema({
  type: { type: String, enum: ["processor", "incident"], required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 180 },
  organisation: { type: String, trim: true, maxlength: 180, default: "" },
  purpose: { type: String, trim: true, maxlength: 2000, default: "" },
  dataCategories: { type: String, trim: true, maxlength: 2000, default: "" },
  systems: { type: String, trim: true, maxlength: 1000, default: "" },
  contact: { type: String, trim: true, maxlength: 180, default: "" },
  agreementStatus: { type: String, enum: ["not_reviewed", "under_review", "signed", "not_required"], default: "not_reviewed" },
  retention: { type: String, trim: true, maxlength: 1000, default: "" },
  status: { type: String, enum: ["open", "investigating", "contained", "resolved", "closed"], default: "open" },
  severity: { type: String, enum: ["low", "medium", "high", "critical"], default: "low" },
  detectedAt: { type: Date, default: null },
  affectedCount: { type: Number, min: 0, max: 100000000, default: 0 },
  containment: { type: String, trim: true, maxlength: 3000, default: "" },
  regulatorNotifiedAt: { type: Date, default: null },
  usersNotifiedAt: { type: Date, default: null },
  resolution: { type: String, trim: true, maxlength: 3000, default: "" },
  notes: { type: String, trim: true, maxlength: 3000, default: "" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  auditHistory: { type: [auditSchema], default: [] }
}, { timestamps: true });

schema.index({ type: 1, updatedAt: -1 });
module.exports = mongoose.model("PrivacyRegisterEntry", schema);
