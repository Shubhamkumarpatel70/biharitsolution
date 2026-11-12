const mongoose = require("mongoose");
const contactSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  phone: { type: String, trim: true, maxlength: 30 },
  company: { type: String, trim: true, maxlength: 160 },
  serviceInterest: { type: String, trim: true, maxlength: 100 },
  budget: { type: String, trim: true, maxlength: 80 },
  subject: { type: String, trim: true, maxlength: 180 },
  message: { type: String, required: true, trim: true, maxlength: 5000 },
  consent: { type: Boolean, default: false },
  status: { type: String, enum: ["new","in-progress","closed"], default: "new", index: true },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  internalNotes: { type: String, default: "" },
  read: { type: Boolean, default: false }
}, { timestamps: true });
module.exports = mongoose.models.Contact || mongoose.model("Contact", contactSchema);