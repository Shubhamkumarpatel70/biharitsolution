const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  discountType: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' },
  eligiblePlans: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Plan' }],
  usageLimit: { type: Number, default: 1 },
  usedCount: { type: Number, default: 0 },
  // Orders in checkout hold a slot until payment succeeds or the order expires.
  reservedCount: { type: Number, default: 0, min: 0 },
  active: { type: Boolean, default: true },
  usedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema); 