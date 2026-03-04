const mongoose = require('mongoose');

const marksheetSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  marksObtained: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  grade: { type: String }
});

const certificateSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  studentName: { type: String, required: true },
  courseName: { type: String, required: true },
  certificateNumber: { type: String, unique: true },
  type: {
    type: String,
    enum: ['marksheet', 'certificate', 'both'],
    default: 'both'
  },
  issueDate: { type: Date, default: Date.now },
  expiryDate: { type: Date },

  // Marksheet fields
  marksheet: {
    subjects: [marksheetSchema],
    totalMarks: { type: Number },
    obtainedMarks: { type: Number },
    percentage: { type: Number },
    grade: { type: String },
    result: {
      type: String,
      enum: ['Pass', 'Fail', 'Distinction', 'First Class', 'Second Class'],
    }
  },

  // Certificate fields
  certificate: {
    achievement: { type: String },
    description: { type: String },
    certificateImageUrl: { type: String }
  },

  status: {
    type: String,
    enum: ['issued', 'pending', 'revoked'],
    default: 'issued'
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  remarks: { type: String }

}, { timestamps: true });

// Auto-generate certificate number
certificateSchema.pre('save', async function (next) {
  if (!this.certificateNumber) {
    const count = await mongoose.model('Certificate').countDocuments();
    this.certificateNumber = `GV-${Date.now()}-${String(count + 1).padStart(4, '0')}`;
  }

  // Auto calculate percentage and grade
  if (this.marksheet && this.marksheet.subjects && this.marksheet.subjects.length > 0) {
    const totalMarks = this.marksheet.subjects.reduce((sum, s) => sum + s.totalMarks, 0);
    const obtainedMarks = this.marksheet.subjects.reduce((sum, s) => sum + s.marksObtained, 0);
    const percentage = (obtainedMarks / totalMarks) * 100;

    this.marksheet.totalMarks = totalMarks;
    this.marksheet.obtainedMarks = obtainedMarks;
    this.marksheet.percentage = parseFloat(percentage.toFixed(2));

    if (percentage >= 75) {
      this.marksheet.grade = 'A+';
      this.marksheet.result = 'Distinction';
    } else if (percentage >= 60) {
      this.marksheet.grade = 'A';
      this.marksheet.result = 'First Class';
    } else if (percentage >= 50) {
      this.marksheet.grade = 'B';
      this.marksheet.result = 'Second Class';
    } else if (percentage >= 33) {
      this.marksheet.grade = 'C';
      this.marksheet.result = 'Pass';
    } else {
      this.marksheet.grade = 'F';
      this.marksheet.result = 'Fail';
    }
  }
  next();
});

module.exports = mongoose.model('Certificate', certificateSchema);