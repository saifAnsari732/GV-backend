const mongoose = require('mongoose');

const jobApplicationSchema = new mongoose.Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applicantName: {
    type: String,
    required: true
  },
  applicantEmail: {
    type: String,
    required: true
  },
  applicantPhone: {
    type: String,
    required: true
  },
  resume: {
    type: String, // URL or file path
    required: true
  },
  coverLetter: {
    type: String
  },
  experience: {
    type: String,
    required: true
  },
  qualifications: {
    type: String,
    required: true
  },
  expectedSalary: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'shortlisted', 'rejected', 'hired'],
    default: 'pending'
  },
  appliedAt: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String // For admin notes
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate applications
jobApplicationSchema.index({ jobId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('JobApplication', jobApplicationSchema);