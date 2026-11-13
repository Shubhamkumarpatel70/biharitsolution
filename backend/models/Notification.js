const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  message: { type: String, required: true },
  title: { type: String },
  eventKey: { type: String, default: '' },
  type: { type: String, enum: ['general', 'agreement', 'subscription', 'project'], default: 'general' },
  link: { type: String, default: '' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null = global
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  expiresAt: { 
    type: Date, 
    default: function() {
      // Set expiration to 3 days from creation
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 3);
      return expirationDate;
    }
  }
}, { timestamps: true });

// Add index for expiration queries
notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ user: 1, expiresAt: 1 });

// Static method to clean expired notifications
notificationSchema.statics.cleanExpired = async function() {
  try {
    const result = await this.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    console.log(`Cleaned ${result.deletedCount} expired notifications`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning expired notifications:', error);
    throw error;
  }
};

module.exports = mongoose.model('Notification', notificationSchema); 