const mongoose = require("mongoose");

const clientWorkSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  logo: { type: String, required: true },
  websiteUrl: { type: String, trim: true, default: "", maxlength: 500 },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

clientWorkSchema.index({ isActive: 1, order: 1, createdAt: -1 });

module.exports = mongoose.model("ClientWork", clientWorkSchema);
