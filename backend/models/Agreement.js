const mongoose = require("mongoose");

const agreementSchema = new mongoose.Schema(
  {
    clientUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
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
    docCode: {
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
      enum: ["draft", "sent", "accepted", "declined", "signed", "archived"],
      default: "draft",
    },
    notes: {
      type: String,
      default: "",
    },
    responseStatus: { type: String, enum: ["pending", "accepted", "declined"], default: "pending" },
    acceptedByName: { type: String, default: "" },
    acceptedAt: { type: Date, default: null },
    acceptedAtIST: { type: String, default: "" },
    acceptedPlace: { type: String, default: "" },
    acceptedLatitude: { type: Number, default: null },
    acceptedLongitude: { type: Number, default: null },
    acceptedTimezone: { type: String, default: "Asia/Kolkata" },
    declinedByName: { type: String, default: "" },
    declinedAt: { type: Date, default: null },
    declineReason: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Agreement", agreementSchema);
