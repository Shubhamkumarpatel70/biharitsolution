const mongoose = require("mongoose");

const agreementSchema = new mongoose.Schema(
  {
    clientName: {
      type: String,
      required: true,
      trim: true,
    },
    clientEmail: {
      type: String,
      trim: true,
      default: "",
    },
    clientCompany: {
      type: String,
      trim: true,
      default: "",
    },
    documentType: {
      type: String,
      required: true,
      enum: [
        "nda",
        "quotation",
        "invoice",
        "welcome",
        "handover",
        "change_request",
        "questionnaire",
      ],
    },
    documentTitle: {
      type: String,
      required: true,
    },
    htmlContent: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "sent", "signed", "archived"],
      default: "draft",
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Agreement", agreementSchema);
