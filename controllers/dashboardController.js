const User = require('../models/User');
const Course = require('../models/Course');
const Job = require('../models/Job');
const Fee = require('../models/Fee');
const Attendance = require('../models/Attendance');

// @desc    Get admin dashboard statistics
// @route   GET /api/dashboard/admin
// @access  Private/Admin
exports.getAdminDashboard = async (req, res) => {
  try {
    // Total students
    const totalStudents = await User.countDocuments({ role: 'student', isActive: true });
    
    // Total courses
    const totalCourses = await Course.countDocuments({ isActive: true });
    
    // Total active jobs
    const totalJobs = await Job.countDocuments({ isActive: true });

    // Fee statistics
    const feeStats = await Fee.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$paidAmount' },
          totalPending: { $sum: '$pendingAmount' },
          totalExpected: { $sum: '$totalFees' }
        }
      }
    ]);

    const revenue = feeStats.length > 0 ? feeStats[0] : {
      totalRevenue: 0,
      totalPending: 0,
      totalExpected: 0
    };

    // Recent enrollments (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentEnrollments = await User.aggregate([
      { $match: { role: 'student', createdAt: { $gte: thirtyDaysAgo } } },
      { $count: 'count' }
    ]);

    // ===== COURSE-WISE STUDENT COUNT - CORRECT METHOD =====
    console.log('=== Starting Course-Wise Student Count ===');
    
    // Get all active courses
    const allCourses = await Course.find({ isActive: true })
      .select('courseName courseCode fees')
      .lean();
    
    console.log(`Found ${allCourses.length} active courses`);

    // Get all students with their enrolledCourses field
    const allStudents = await User.find({ 
      role: 'student', 
      isActive: true 
    }).select('_id name courseNames.course').lean();
    
    console.log(`\nTotal active students: ${allStudents.length}`);
    console.log('\n=== Detailed Student Enrollment Check ===');
    
    // Build a map of course ID to student count
    const courseStudentMap = new Map();
    
    // Initialize all courses with 0
    allCourses.forEach(course => {
      courseStudentMap.set(course._id.toString(), []);
    });
    
    // Method 1: Check User.enrolledCourses field
    allStudents.forEach((student, idx) => {
      console.log(`\nStudent ${idx + 1}: ${student.name} (${student._id})`);
      console.log(`  enrolledCourses field:`, JSON.stringify(student.enrolledCourses));
      
      if (student.enrolledCourses && Array.isArray(student.enrolledCourses) && student.enrolledCourses.length > 0) {
        student.enrolledCourses.forEach(enrollment => {
          let courseId = null;
          
          if (enrollment) {
            if (typeof enrollment === 'object') {
              // Structure: { course: ObjectId, ... }
              if (enrollment.course) {
                courseId = enrollment.course.toString();
              }
              // Structure: ObjectId directly
              else if (enrollment._id) {
                courseId = enrollment._id.toString();
              }
            } else {
              // Direct ObjectId
              courseId = enrollment.toString();
            }
          }
          
          if (courseId && courseStudentMap.has(courseId)) {
            const students = courseStudentMap.get(courseId);
            students.push(student._id);
            courseStudentMap.set(courseId, students);
            console.log(`  ✅ Enrolled in course: ${courseId}`);
          }
        });
      } else {
        console.log(`  ⚠️  No enrolledCourses data`);
      }
    });

    console.log('\n=== Course Student Counts (from User.enrolledCourses) ===');
    courseStudentMap.forEach((students, courseId) => {
      const course = allCourses.find(c => c._id.toString() === courseId);
      if (course) {
        console.log(`${course.courseName}: ${students.length} students`);
      }
    });

    // If all courses have 0 students, try alternative methods
    const totalEnrolled = Array.from(courseStudentMap.values()).reduce((sum, arr) => sum + arr.length, 0);
    
    if (totalEnrolled === 0) {
      console.log('\n⚠️  User.enrolledCourses is empty, trying Fee collection...');
      
      // Method 2: Use Fee collection
      const feeRecords = await Fee.find({})
        .select('student course')
        .lean();
      
      console.log(`Found ${feeRecords.length} fee records`);
      
      const studentCourseSet = new Map();
      
      feeRecords.forEach(fee => {
        if (fee.course && fee.student) {
          const courseId = fee.course.toString();
          const studentId = fee.student.toString();
          
          if (!studentCourseSet.has(courseId)) {
            studentCourseSet.set(courseId, new Set());
          }
          studentCourseSet.get(courseId).add(studentId);
        }
      });
      
      console.log('\n=== Course Student Counts (from Fee collection) ===');
      studentCourseSet.forEach((studentSet, courseId) => {
        const course = allCourses.find(c => c._id.toString() === courseId);
        if (course) {
          const studentArray = Array.from(studentSet);
          courseStudentMap.set(courseId, studentArray);
          console.log(`${course.courseName}: ${studentArray.length} students`);
        }
      });
    }

    // Build final courseWiseStudents array
    const courseWiseStudents = allCourses
      .map(course => {
        const courseId = course._id.toString();
        const students = courseStudentMap.get(courseId) || [];
        
        return {
          _id: course._id,
          courseName: course.courseName,
          courseCode: course.courseCode,
          totalStudents: students.length,
          fees: course.fees
        };
      })
      .sort((a, b) => b.totalStudents - a.totalStudents)
      .slice(0, 5);

    console.log('\n=== Final Course-Wise Students ===');
    courseWiseStudents.forEach(course => {
      console.log(`${course.courseName}: ${course.totalStudents} students`);
    });
    console.log('=== Course-Wise Student Count Complete ===\n');

    // Recent students
    const recentStudents = await User.find({ role: 'student' })
      .select('name email phone profileImage createdAt')
      .sort({ createdAt: -1 })
      .limit(5);

    // Attendance summary (today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAttendance = await Attendance.aggregate([
      { $match: { date: today } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const attendanceSummary = {
      present: 0,
      absent: 0,
      late: 0
    };

    todayAttendance.forEach(item => {
      attendanceSummary[item._id] = item.count;
    });

    // Monthly revenue (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyRevenue = await Fee.aggregate([
      {
        $unwind: '$payments'
      },
      {
        $match: {
          'payments.paymentDate': { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$payments.paymentDate' },
            month: { $month: '$payments.paymentDate' }
          },
          revenue: { $sum: '$payments.amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalStudents,
          totalCourses,
          totalJobs,
          recentEnrollments: recentEnrollments.length > 0 ? recentEnrollments[0].count : 0
        },
        revenue: {
          totalRevenue: revenue.totalRevenue,
          totalPending: revenue.totalPending,
          totalExpected: revenue.totalExpected,
          collectionPercentage: revenue.totalExpected > 0 
            ? ((revenue.totalRevenue / revenue.totalExpected) * 100).toFixed(2) 
            : 0
        },
        courseWiseStudents,
        recentStudents,
        attendanceSummary,
        monthlyRevenue
      }
    });
  } catch (error) {
    console.error('Admin Dashboard Error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get student dashboard
// @route   GET /api/dashboard/student
// @access  Private/Student
exports.getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user.id;
    
    console.log("Fetching dashboard for student:", studentId); // Debug log

    // Get student details with enrolled courses
    const student = await User.findById(studentId)
      .populate('courseNames.course', 'courseName courseCode fees courseImage')
      .select('-password');

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    console.log("Student found:", student._id); // Debug log
    console.log("CourseNames:", student.courseNames); // Debug log

    // Get fee records
    const fees = await Fee.find({ student: studentId })
      .populate('course', 'courseName courseCode')
      .sort({ createdAt: -1 });

    console.log("Fees found:", fees.length); // Debug log

    // Get attendance records
    const attendance = await Attendance.find({ student: studentId })
      .populate('course', 'courseName courseCode')
      .sort({ date: -1 })
      .limit(10);

    console.log("Attendance found:", attendance.length); // Debug log

    // Calculate overall attendance percentage
    const totalAttendance = await Attendance.countDocuments({ student: studentId });
    const presentCount = await Attendance.countDocuments({
      student: studentId,
      status: { $in: ['present', 'late'] }
    });
    
    const attendancePercentage = totalAttendance > 0 
      ? Number(((presentCount / totalAttendance) * 100).toFixed(2))
      : 0;

    // Calculate total fees statistics with safe defaults
    const totalFees = fees?.reduce((sum, fee) => sum + (fee.totalFees || 0), 0) || 0;
    const totalPaid = fees?.reduce((sum, fee) => sum + (fee.paidAmount || 0), 0) || 0;
    const totalPending = fees?.reduce((sum, fee) => sum + (fee.pendingAmount || 0), 0) || 0;

    // Prepare response data with proper null checks
    const responseData = {
      student: {
        _id: student._id,
        name: student.name || '',
        email: student.email || '',
        phone: student.phone || '',
        profileImage: student.profileImage || 'default-avatar.jpg',
        enrolledCourses: student.courseNames || [] // Using courseNames instead of enrolledCourses
      },
      coursesCount: student.courseNames?.length || 0,
      fees: {
        total: totalFees,
        paid: totalPaid,
        pending: totalPending,
        records: fees || []
      },
      attendance: {
        percentage: attendancePercentage,
        total: totalAttendance || 0,
        present: presentCount || 0,
        recentRecords: attendance || []
      }
    };

    console.log("Sending response data"); // Debug log

    res.status(200).json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Student dashboard error:', error); // Debug log
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch student dashboard'
    });
  }
};