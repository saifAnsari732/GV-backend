const User = require('../models/User');
const Course = require('../models/Course');
const Fee = require('../models/Fee');

// @desc    Get all students
// @route   GET /api/students
// @access  Private/Admin
exports.getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .populate('courseNames.course')
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: students.length,
      data: students
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Private/Admin
exports.getStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.id)
      .populate('courseNames.course', 'courseName courseCode fees')
      .select('-password');

    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Enroll student in course
// @route   POST /api/students/:id/enroll
// @access  Private/Admin
exports.enrollStudent = async (req, res) => {
  try {
    const { courseId } = req.body;
    const student = await User.findById(req.params.id);

    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if already enrolled
    const alreadyEnrolled = student.enrolledCourses.some(
      ec => ec.course.toString() === courseId
    );

    if (alreadyEnrolled) {
      return res.status(400).json({
        success: false,
        message: 'Student is already enrolled in this course'
      });
    }

    // Enroll student
    student.enrolledCourses.push({
      course: courseId,
      status: 'active'
    });
    await student.save();

    // Update course total students
    course.totalStudents += 1;
    await course.save();

    // Create fee record
    await Fee.create({
      student: student._id,
      course: courseId,
      totalFees: course.fees,
      paidAmount: 0,
      pendingAmount: course.fees,
      status: 'pending'
    });

    res.status(200).json({
      success: true,
      message: 'Student enrolled successfully',
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private/Admin
exports.updateStudent = async (req, res) => {
  try {
    const student = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete/Deactivate student
// @route   DELETE /api/students/:id
// @access  Private/Admin
exports.deleteStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);

    if (!student || student.role !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    student.isActive = false;
    await student.save();

    res.status(200).json({
      success: true,
      message: 'Student deactivated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
