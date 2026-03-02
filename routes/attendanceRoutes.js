const express = require('express');
const router = express.Router();
const {
  markAttendance,
  getStudentAttendance,
  getCourseAttendance,
  bulkMarkAttendance
} = require('../controllers/attendanceController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/', protect, adminOnly, markAttendance);
router.post('/bulk', protect, adminOnly, bulkMarkAttendance);
router.get('/student/:studentId', protect, getStudentAttendance);
router.get('/course/:courseId', protect, adminOnly, getCourseAttendance);

module.exports = router;
