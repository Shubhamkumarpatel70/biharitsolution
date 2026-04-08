const mongoose = require('mongoose');

const careerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    location: { type: String, default: '' },
    employmentType: { type: String, default: 'Full-time' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Career', careerSchema);
