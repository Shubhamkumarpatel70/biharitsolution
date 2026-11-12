const mongoose = require("mongoose");
const siteContentSchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ["page","service","product","portfolio","industry","article","career","testimonial","site-setting"], index: true },
  title: { type: String, required: true, trim: true, maxlength: 180 },
  slug: { type: String, required: true, trim: true, lowercase: true, maxlength: 180 },
  summary: { type: String, trim: true, maxlength: 500, default: "" },
  body: { type: String, default: "" },
  category: { type: String, trim: true, maxlength: 80, default: "" },
  tags: { type: [String], default: [] },
  imageUrl: { type: String, default: "" },
  imageAlt: { type: String, trim: true, maxlength: 250, default: "" },
  status: { type: String, enum: ["draft","published","archived"], default: "draft", index: true },
  sortOrder: { type: Number, default: 0 },
  seo: { title: { type: String, default: "" }, description: { type: String, default: "" } },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });
siteContentSchema.index({ type: 1, slug: 1 }, { unique: true });
siteContentSchema.index({ type: 1, status: 1, category: 1, sortOrder: 1 });
module.exports = mongoose.models.SiteContent || mongoose.model("SiteContent", siteContentSchema);