const mongoose = require("mongoose");
const mediaSchema = new mongoose.Schema({
  originalName: { type: String, required: true, maxlength: 255 },
  secureUrl: { type: String, required: true },
  publicId: { type: String, required: true, unique: true },
  resourceType: { type: String, default: "image" },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  altText: { type: String, default: "", maxlength: 250 },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });
mediaSchema.index({ createdAt: -1 });
module.exports = mongoose.models.Media || mongoose.model("Media", mediaSchema);