const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getStudentDashboard
} = require('../controllers/dashboardController');
const { protect, adminOnly, studentOnly } = require('../middleware/auth');

router.get('/admin', protect, adminOnly, getAdminDashboard);
router.get('/student', protect, studentOnly, getStudentDashboard);

module.exports = router;
