const mongoose = require("mongoose");

const paymentModeSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, default: "checkout" },
  mode: { type: String, enum: ["manual", "cashfree"], default: "cashfree", required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
}, { timestamps: true });

module.exports = mongoose.model("PaymentMode", paymentModeSchema);
