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
  },
  { timestamps: true },
);

fundTransactionSchema.index({ createdAt: -1 });

module.exports = mongoose.model("FundTransaction", fundTransactionSchema);
