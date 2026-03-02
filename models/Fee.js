const mongoose = require('mongoose');

const feeSchema = new mongoose.Schema({
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
  totalFees: {
    type: Number,
    required: true
  },
  paidAmount: {
    type: Number,
    default: 0
  },
  pendingAmount: {
    type: Number,
    required: true
  },
  payments: [{
    amount: {
      type: Number,
      required: true
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    paymentMode: {
      type: String,
      enum: ['Cash', 'Online', 'Card', 'UPI', 'Cheque'],
      required: true
    },
    transactionId: String,
    remarks: String,
  }],
  status: {
    type: String,
    enum: ['pending', 'partial', 'paid'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Update pending amount and status before saving
feeSchema.pre('save', function(next) {
  this.pendingAmount = this.totalFees - this.paidAmount;
  
  if (this.paidAmount === 0) {
    this.status = 'pending';
  } else if (this.paidAmount < this.totalFees) {
    this.status = 'partial';
  } else {
    this.status = 'paid';
  }
  
  next();
});

module.exports = mongoose.model('Fee', feeSchema);
