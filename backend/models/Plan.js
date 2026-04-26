const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    price: { type: String, required: true },
    oldPrice: { type: String },
    savings: { type: String }, // Renamed from 'save' to avoid Mongoose reserved keyword conflict
    features: [{ type: String }],
    notes: [{ type: String }],
    highlight: { type: Boolean, default: false },
    color: { type: String },
    duration: { type: String, required: true }, // e.g. "30" or "30-40" days
  },
  { timestamps: true, suppressReservedKeysWarning: true },
);

module.exports = mongoose.model("Plan", planSchema);
