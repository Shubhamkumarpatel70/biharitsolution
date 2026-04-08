const mongoose = require('mongoose');

const careerApplicationSchema = new mongoose.Schema(
  {
    career: { type: mongoose.Schema.Types.ObjectId, ref: 'Career', required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    resumeData: { type: String, required: true },
    resumeMimeType: { type: String, required: true },
    resumeFileName: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CareerApplication', careerApplicationSchema);
