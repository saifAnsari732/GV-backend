const Fee = require('../models/Fee');

// @desc    Get all fee records
// @route   GET /api/fees
// @access  Private/Admin
exports.getAllFees = async (req, res) => {
  try {
    const fees = await Fee.find()
      .populate('student', 'name email phone')
      .populate('course', 'courseName courseCode')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: fees.length,
      data: fees
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get fee record for a student
// @route   GET /api/fees/student/:studentId
// @access  Private
// @desc    Get fee record for a student
// @route   GET /api/fees/student/:studentId
// @access  Private
exports.getStudentFees = async (req, res) => {
  console.log("Params received:", req.params); // This will show { studentId: 'some-id' }
  console.log("Student ID:", req.params.studentId); // This will show the actual ID
  
  try {
    // WRONG: findById searches by _id field (Fee's own ID)
    // const fees = await Fee.findById(req.params.studentId)
    
    // CORRECT: find searches by any field, here we want student field
    const fees = await Fee.find({ student: req.params.studentId });
    
    console.log("Found fees:", fees); // Debug log
    
    if (!fees || fees.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No fee records found for this student',
        data: []
      });
    }

    res.status(200).json({
      success: true,
      count: fees.length,
      data: fees
    });
  } catch (error) {
    console.error("Error in getStudentFees:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get fee record by ID
// @route   GET /api/fees/:id
// @access  Private
exports.getFeeRecord = async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id)
      .populate('student', 'name email phone')
      .populate('course', 'courseName courseCode')
      .populate('payments.receivedBy', 'name');

    if (!fee) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: fee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add payment
// @route   POST /api/fees/:id/payment
// @access  Private/Admin
exports.addPayment = async (req, res) => {
  try {
    const { amount, paymentMode, transactionId, remarks } = req.body;
    
    const fee = await Fee.findById(req.params.id);

    if (!fee) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found'
      });
    }

    // Validate payment amount
    if (amount <= 0 || amount > fee.pendingAmount) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount'
      });
    }

    // Add payment
    fee.payments.push({
      amount,
      paymentMode,
      transactionId,
      remarks,
      receivedBy: req.user.id
    });

    fee.paidAmount += amount;
    await fee.save();

    res.status(200).json({
      success: true,
      message: 'Payment added successfully',
      data: fee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get pending fees
// @route   GET /api/fees/pending
// @access  Private/Admin
exports.getPendingFees = async (req, res) => {
  try {
    const pendingFees = await Fee.find({
      status: { $in: ['pending', 'partial'] }
    })
      .populate('student', 'name email phone')
      .populate('course', 'courseName courseCode')
      .sort({ pendingAmount: -1 });

    // Calculate total pending amount
    const totalPending = pendingFees.reduce((sum, fee) => sum + fee.pendingAmount, 0);

    res.status(200).json({
      success: true,
      count: pendingFees.length,
      totalPending,
      data: pendingFees
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get fee statistics
// @route   GET /api/fees/statistics
// @access  Private/Admin
exports.getFeeStatistics = async (req, res) => {
  try {
    const allFees = await Fee.find();

    const statistics = {
      totalFees: 0,
      totalPaid: 0,
      totalPending: 0,
      fullyPaid: 0,
      partiallyPaid: 0,
      unpaid: 0
    };

    allFees.forEach(fee => {
      statistics.totalFees += fee.totalFees;
      statistics.totalPaid += fee.paidAmount;
      statistics.totalPending += fee.pendingAmount;

      if (fee.status === 'paid') statistics.fullyPaid++;
      else if (fee.status === 'partial') statistics.partiallyPaid++;
      else statistics.unpaid++;
    });

    res.status(200).json({
      success: true,
      data: statistics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create a fee record
// @route   POST /api/fees
// @access  Private/Admin
exports.createFeeRecord = async (req, res) => {
  try {
    const { studentId, courseId, totalFees, paidAmount, paymentMode, transactionId, remarks } = req.body;

    // Calculate pending amount
    const pendingAmount = totalFees - (paidAmount || 0);
    
    // Determine status
    let status = 'pending';
    if (paidAmount >= totalFees) {
      status = 'paid';
    } else if (paidAmount > 0) {
      status = 'partial';
    }

    const feeData = {
      student: studentId,
      course: courseId,
      totalFees,
      paidAmount: paidAmount || 0,
      pendingAmount,
      status,
      payments: []
    };

    // Add initial payment if any
    if (paidAmount > 0) {
      feeData.payments = [{
        amount: paidAmount,
        paymentMode: paymentMode || 'Cash',
        paymentDate: new Date(),
        transactionId,
        remarks: remarks || 'Initial payment'
      }];
    }

    const fee = await Fee.create(feeData);

    res.status(201).json({
      success: true,
      message: 'Fee record created successfully',
      data: fee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};