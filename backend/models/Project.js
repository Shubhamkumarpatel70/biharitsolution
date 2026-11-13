const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 140 },
  description: { type: String, required: true, trim: true, maxlength: 1200 },
  category: { type: String, trim: true, default: "Web App", maxlength: 80 },
  highlight: { type: String, trim: true, default: "", maxlength: 160 },
  technologies: { type: [String], default: [] },
  projectUrl: { type: String, trim: true, default: "", maxlength: 500 },
  icon: { type: String, trim: true, default: "briefcase", maxlength: 50 },
  color: { type: String, default: "#64748b", match: /^#[0-9a-fA-F]{6}$/ },
  image: { type: String, default: "" },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

projectSchema.index({ isActive: 1, order: 1, createdAt: -1 });

module.exports = mongoose.model("Project", projectSchema);
