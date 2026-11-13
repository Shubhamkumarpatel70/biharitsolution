const mongoose = require('mongoose');

const newsletterSubscriberSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  status: { type: String, enum: ['subscribed', 'unsubscribed'], default: 'subscribed' },
  consentedAt: { type: Date, default: null },
  consentSource: { type: String, default: "newsletter-form" },
  consentedBy: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('NewsletterSubscriber', newsletterSubscriberSchema); 