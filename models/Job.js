const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true
  },
  company: {
    type: String,
    required: [true, 'Company name is required']
  },
  location: {
    type: String,
    required: [true, 'Location is required']
  },
  salary: {
    type: String,
    required: [true, 'Salary range is required']
  },
  jobType: {
    type: String,
    enum: ['Full-time', 'Part-time', 'Internship', 'Contract'],
    required: [true, 'Job type is required']
  },
  description: {
    type: String,
    required: [true, 'Job description is required']
  },
  requirements: [String],
  skills: [String],
  lastDate: {
    type: Date,
  },
  applyLink: {
    type: String
  },
  contactEmail: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },

}, {
  timestamps: true
});

module.exports = mongoose.model('Job', jobSchema);
