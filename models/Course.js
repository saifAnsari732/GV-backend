const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseName: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true
  },
  courseCode: {
    type: String,
    required: [true, 'Course code is required'],
    unique: true,
    uppercase: true
  },
  duration: {
    type: String,
    required: [true, 'Duration is required']
  },
  fees: {
    type: Number,
    required: [true, 'Fees is required']
  },
  description: {
    type: String,
    // required: [true, 'Description is required']
  },
  syllabus: [{
    topic: String,
    subtopics: [String]
  }],
  // In models/Course.js, make sure you have:
courseImage: {
  type: String,
  default: ''
},
  isActive: {
    type: Boolean,
    default: true
  },
  totalStudents: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    enum: ['Basic Computer', 'Advanced Computer', 'Accounting', 'Programming', 'Certification', 'Other'],
    default: 'Other'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Course', courseSchema);
