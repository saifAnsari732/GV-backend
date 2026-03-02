const Attendance = require('../models/Attendance');
const User = require('../models/User');

// @desc    Mark attendance
// @route   POST /api/attendance
// @access  Private/Admin
exports.markAttendance = async (req, res) => {
  try {
    const { studentId, courseId, date, status, remarks } = req.body;

    // Check if attendance already marked for this date
    const existingAttendance = await Attendance.findOne({
      student: studentId,
      course: courseId,
      date: new Date(date).setHours(0, 0, 0, 0)
    });

    if (existingAttendance) {
      // Update existing attendance
      existingAttendance.status = status;
      existingAttendance.remarks = remarks;
      await existingAttendance.save();

      return res.status(200).json({
        success: true,
        message: 'Attendance updated successfully',
        data: existingAttendance
      });
    }

    // Create new attendance record
    const attendance = await Attendance.create({
      student: studentId,
      course: courseId,
      date: new Date(date).setHours(0, 0, 0, 0),
      status,
      remarks,
      markedBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get attendance for a student
// @route   GET /api/attendance/student/:studentId
// @access  Private
exports.getStudentAttendance = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { courseId, startDate, endDate } = req.query;

    let query = { student: studentId };
    
    if (courseId) {
      query.course = courseId;
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .populate('course', 'courseName courseCode')
      .populate('markedBy', 'name')
      .sort({ date: -1 });

    // Calculate statistics
    const total = attendance.length;
    const present = attendance.filter(a => a.status === 'present').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const late = attendance.filter(a => a.status === 'late').length;
    const percentage = total > 0 ? ((present + late * 0.5) / total * 100).toFixed(2) : 0;

    res.status(200).json({
      success: true,
      data: attendance,
      statistics: {
        total,
        present,
        absent,
        late,
        percentage
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get attendance for a course
// @route   GET /api/attendance/course/:courseId
// @access  Private/Admin
exports.getCourseAttendance = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { date } = req.query;

    let query = { course: courseId };
    
    if (date) {
      query.date = new Date(date).setHours(0, 0, 0, 0);
    }

    const attendance = await Attendance.find(query)
      .populate('student', 'name email profileImage')
      .populate('markedBy', 'name')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      count: attendance.length,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Bulk mark attendance
// @route   POST /api/attendance/bulk
// @access  Private/Admin
exports.bulkMarkAttendance = async (req, res) => {
  try {
    const { courseId, date, attendanceData } = req.body;
    // attendanceData format: [{ studentId, status, remarks }]

    const attendanceRecords = [];
    const errors = [];

    for (const record of attendanceData) {
      try {
        const existingAttendance = await Attendance.findOne({
          student: record.studentId,
          course: courseId,
          date: new Date(date).setHours(0, 0, 0, 0)
        });

        if (existingAttendance) {
          existingAttendance.status = record.status;
          existingAttendance.remarks = record.remarks || '';
          await existingAttendance.save();
          attendanceRecords.push(existingAttendance);
        } else {
          const attendance = await Attendance.create({
            student: record.studentId,
            course: courseId,
            date: new Date(date).setHours(0, 0, 0, 0),
            status: record.status,
            remarks: record.remarks || '',
            markedBy: req.user.id
          });
          attendanceRecords.push(attendance);
        }
      } catch (error) {
        errors.push({
          studentId: record.studentId,
          error: error.message
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Bulk attendance marked successfully',
      data: attendanceRecords,
      errors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
