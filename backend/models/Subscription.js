const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: String, enum: ['starter', 'premium', 'pro'], required: true },
  status: { type: String, enum: ['pending', 'active', 'rejected', 'expired'], default: 'pending' },
  uniqueId: { type: String, required: true, unique: true },
  rejectionReason: { type: String },
  expiresAt: { type: Date },
  canceled: { type: Boolean, default: false },
  cancellationReason: { type: String },
  cancellationRequestDate: { type: Date },
  // Payment fields
  transactionId: { type: String },
  paymentMethod: { type: String, enum: ['upi', 'card', 'netbanking'], default: 'upi' },
  paymentImage: { type: String }, // Base64 encoded image
  // Renewal request fields
  renewalRequested: { type: Boolean, default: false },
  renewalRequestDate: { type: Date },
  renewalStatus: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
  renewalRejectionReason: { type: String },
  renewalApprovedDate: { type: Date },
  renewalExpiresAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema); 