const express = require('express');
const router = express.Router();
const { protect,adminOnly  } = require('../middleware/auth');
const {
  applyForJob,
  getUserApplications,
  getApplicationById,
  getJobApplications,
  updateApplicationStatus,
  getAllApplications
} = require('../controllers/applicationController');

// User routes
router.post('/apply', protect, applyForJob);
router.get('/my-applications', protect, getUserApplications);
router.get('/:id', protect, getApplicationById);

// Admin routes
router.get('/admin/all', protect, adminOnly, getAllApplications);
router.get('/admin/job/:jobId', protect, adminOnly, getJobApplications);
router.put('/admin/:id/status', protect, adminOnly, updateApplicationStatus);

module.exports = router;