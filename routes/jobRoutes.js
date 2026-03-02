const express = require('express');
const router = express.Router();
const {
  getAllJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob
} = require('../controllers/jobController');
const { protect, adminOnly } = require('../middleware/auth');

router.route('/')
  .get(getAllJobs)
  .post(protect, adminOnly, createJob);

router.route('/:id')
  .get(getJob)
  .put(protect, adminOnly, updateJob)
  .delete(protect, adminOnly, deleteJob);

module.exports = router;
