const mongoose = require('mongoose');

const paymentOptionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  upiId: { type: String, trim: true, default: "" },
  accountName: { type: String, trim: true, default: "" },
  accountNumber: { type: String, trim: true, default: "" },
  ifscCode: { type: String, trim: true, uppercase: true, default: "" },
  bankName: { type: String, trim: true, default: "" },
  branch: { type: String, trim: true, default: "" },
  qrCode: {
    type: String, // URL to QR code image
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    trim: true
  },
  paymentType: {
    type: String,
    enum: ['UPI', 'BANK_TRANSFER', 'WALLET'],
    default: 'UPI'
  }
}, { timestamps: true });

// Index for efficient queries
paymentOptionSchema.index({ isActive: 1, order: 1 });
paymentOptionSchema.index({ upiId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('PaymentOption', paymentOptionSchema);
