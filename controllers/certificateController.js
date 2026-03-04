const Certificate = require('../models/Certificate');
const User = require('../models/User');  // ✅ Add karo
const Course = require('../models/Course'); 
// @desc    Create certificate/marksheet
// @route   POST /api/certificates
// @access  Admin
const createCertificate = async (req, res) => {
  try {
    const {
      student, course, studentName, courseName,
      type, issueDate, expiryDate, marksheet,
      certificate, remarks
    } = req.body;

    const newCertificate = new Certificate({
      student, course, studentName, courseName,
      type, issueDate, expiryDate, marksheet,
      certificate, remarks,
      issuedBy: req.user?._id
    });

    await newCertificate.save();

    res.status(201).json({
      success: true,
      message: 'Certificate created successfully',
      data: newCertificate
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all certificates (Admin)
// @route   GET /api/certificates
// @access  Admin
const getAllCertificates = async (req, res) => {
  try {
    const { status, type, search } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (search) {
      filter.$or = [
        { studentName: { $regex: search, $options: 'i' } },
        { courseName: { $regex: search, $options: 'i' } },
        { certificateNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const certificates = await Certificate.find(filter)
      .populate('student', 'name email phone')
      .populate('course', 'courseName courseCode')
      .populate('issuedBy', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: certificates.length, data: certificates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get certificate by ID
// @route   GET /api/certificates/:id
// @access  Public
const getCertificateById = async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .populate('student', 'name email phone')
      .populate('course', 'courseName courseCode duration');

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    res.json({ success: true, data: certificate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get certificates by student ID
// @route   GET /api/certificates/student/:studentId
// @access  Private
const getStudentCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({ student: req.params.studentId })
      .populate('course', 'courseName courseCode duration')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: certificates.length, data: certificates });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify certificate by certificate number
// @route   GET /api/certificates/verify/:certNumber
// @access  Public
const verifyCertificate = async (req, res) => {
  try {
     console.log('Searching for:', req.params.certNumber); 
    const certificate = await Certificate.findOne({
      certificateNumber: req.params.certNumber
    }).populate('student', 'name').populate('course', 'courseName');

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found or invalid' });
    }

    res.json({
      success: true,
      message: 'Certificate is valid',
      data: {
        certificateNumber: certificate.certificateNumber,
        studentName: certificate.studentName,
        courseName: certificate.courseName,
        issueDate: certificate.issueDate,
        status: certificate.status,
        type: certificate.type
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update certificate
// @route   PUT /api/certificates/:id
// @access  Admin
const updateCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    res.json({ success: true, message: 'Certificate updated', data: certificate });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete certificate
// @route   DELETE /api/certificates/:id
// @access  Admin
const deleteCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findByIdAndDelete(req.params.id);

    if (!certificate) {
      return res.status(404).json({ success: false, message: 'Certificate not found' });
    }

    res.json({ success: true, message: 'Certificate deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createCertificate,
  getAllCertificates,
  getCertificateById,
  getStudentCertificates,
  verifyCertificate,
  updateCertificate,
  deleteCertificate
};