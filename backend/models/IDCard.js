const mongoose = require("mongoose");

const idCardSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    idNumber: {
      type: String,
      required: true,
    },
    photo: {
      type: String, // Base64 string
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("IDCard", idCardSchema);
