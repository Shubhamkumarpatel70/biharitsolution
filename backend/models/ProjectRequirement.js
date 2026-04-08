const mongoose = require('mongoose');

const statusTimelineEntrySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['pending', 'under_review', 'under_development', 'last_stage', 'finished'],
      required: true,
    },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const projectRequirementSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  submissionId: { type: String, unique: true, sparse: true },
  projectIdea: { type: String, required: true },
  websitePreference: { type: String },
  linkOption: { type: String },
  status: {
    type: String,
    enum: ['pending', 'under_review', 'under_development', 'last_stage', 'finished'],
    default: 'pending',
  },
  statusTimeline: { type: [statusTimelineEntrySchema], default: [] },
  estimatedCompletionDate: { type: Date },
  finishedAt: { type: Date },
  projectLink: { type: String },
  adminNotes: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('ProjectRequirement', projectRequirementSchema);

