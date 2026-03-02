const express = require('express');
const router = express.Router();
const {
  getAllFees,
  getStudentFees,
  getFeeRecord,
  addPayment,
  getPendingFees,
  getFeeStatistics,
  createFeeRecord
} = require('../controllers/feeController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, adminOnly, getAllFees);
router.get('/pending', protect, adminOnly, getPendingFees);
router.get('/statistics', protect, adminOnly, getFeeStatistics);
router.get('/student/:studentId', protect, getStudentFees);
router.get('/:id', protect, getFeeRecord);
router.post('/:id/payment', protect, adminOnly, addPayment);
router.post('/', protect, adminOnly, createFeeRecord);
module.exports = router;
