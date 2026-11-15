const mongoose = require("mongoose");

const fundTransactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["add", "withdraw"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    voidedAt: { type: Date, default: null },
    voidedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    voidReason: { type: String, trim: true, maxlength: 500, default: "" },
  },
  { timestamps: true },
);

fundTransactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model("FundTransaction", fundTransactionSchema);
