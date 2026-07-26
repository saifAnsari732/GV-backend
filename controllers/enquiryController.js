const Enquiry = require('../models/Enquiry');

// @desc    Create new enquiry
// @route   POST /api/enquiries
// @access  Public
exports.createEnquiry = async (req, res) => {
  try {
    const { name, phone, course, address } = req.body;

    if (!name || !phone || !course || !address) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (name, phone, course, address)'
      });
    }

    const enquiry = await Enquiry.create({
      name,
      phone,
      course,
      address
    });

    res.status(201).json({
      success: true,
      message: 'Enquiry submitted successfully',
      data: enquiry
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all enquiries
// @route   GET /api/enquiries
// @access  Private/Admin
exports.getAllEnquiries = async (req, res) => {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: enquiries.length,
      data: enquiries
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
