const mongoose = require("mongoose");
const auditLogSchema = new mongoose.Schema({
  actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  action: { type: String, required: true, maxlength: 80 },
  entityType: { type: String, required: true, maxlength: 80 },
  entityId: { type: String, default: "" },
  summary: { type: String, required: true, maxlength: 300 }
}, { timestamps: true });
auditLogSchema.index({ createdAt: -1 });
module.exports = mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);