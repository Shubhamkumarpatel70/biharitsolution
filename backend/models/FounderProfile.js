const mongoose = require("mongoose");

const founderProfileSchema = new mongoose.Schema({
  key: { type: String, default: "founder", unique: true, required: true },
  image: { type: String, required: true },
  mimeType: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  updatedBy: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("FounderProfile", founderProfileSchema);
