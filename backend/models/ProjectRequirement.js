const mongoose = require('mongoose');

const projectRequirementSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  projectIdea: { type: String, required: true },
  websitePreference: { type: String },
  linkOption: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'under_review', 'under_development', 'last_stage', 'finished'], 
    default: 'pending' 
  },
  projectLink: { type: String }, // Only set when status is 'finished'
  adminNotes: { type: String }, // Admin can add notes
}, { timestamps: true });

module.exports = mongoose.model('ProjectRequirement', projectRequirementSchema);

