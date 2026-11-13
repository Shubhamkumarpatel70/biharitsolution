const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: String, enum: ['starter', 'premium', 'pro'], required: true },
  planName: { type: String, trim: true, default: '' },
  sourcePlan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', default: null },
  totalAmount: { type: Number, min: 0, default: 0 },
  paymentEntries: [{ amount: { type: Number, required: true, min: 0.01 }, method: { type: String, default: 'manual' }, reference: { type: String, default: '' }, note: { type: String, default: '' }, status: { type: String, enum: ['pending','confirmed','rejected'], default: 'confirmed' }, recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, recordedAt: { type: Date, default: Date.now } }],
  status: { type: String, enum: ['pending', 'active', 'rejected', 'expired'], default: 'pending' },
  uniqueId: { type: String, required: true, unique: true },
  rejectionReason: { type: String },
  expiresAt: { type: Date },
  canceled: { type: Boolean, default: false },
  cancellationReason: { type: String },
  cancellationRequestDate: { type: Date },
  cancellationStatus: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
  cancellationRejectionReason: { type: String },
  cancellationApprovedDate: { type: Date },
  // Payment fields
  transactionId: { type: String },
  paymentMethod: { type: String, enum: ['upi', 'card', 'netbanking', 'cashfree'], default: 'upi' },
  paymentImage: { type: String }, // Base64 encoded image
  cashfreeOrderId: { type: String, unique: true, sparse: true },
  paymentStatus: { type: String, default: 'pending' },
  amountPaid: { type: Number },
  durationDays: { type: Number },
  // Renewal request fields
  renewalRequested: { type: Boolean, default: false },
  renewalRequestDate: { type: Date },
  renewalStatus: { type: String, enum: ['none', 'pending', 'approved', 'rejected'], default: 'none' },
  renewalRejectionReason: { type: String },
  renewalApprovedDate: { type: Date },
  renewalExpiresAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Subscription', subscriptionSchema); 