const express = require('express');
const router = express.Router();
const {
  getAllFees,
  getStudentFees,
  getFeeRecord,
  addPayment,
  getPendingFees,
  getFeeStatistics,
  createFeeRecord,
  submitPaymentRequest,
  approvePaymentRequest,
  rejectPaymentRequest,
  getPendingPaymentRequests
} = require('../controllers/feeController');
const { protect, adminOnly } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer for screenshot uploads
const screenshotStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = '/tmp/screenshots';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, 'screenshot-' + Date.now() + path.extname(file.originalname));
  }
});
const uploadScreenshot = multer({ storage: screenshotStorage, limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', protect, adminOnly, getAllFees);
router.get('/pending', protect, adminOnly, getPendingFees);
router.get('/statistics', protect, adminOnly, getFeeStatistics);
router.get('/payment-requests', protect, adminOnly, getPendingPaymentRequests);
router.get('/student/:studentId', protect, getStudentFees);
router.get('/:id', protect, getFeeRecord);
router.post('/:id/payment', protect, adminOnly, addPayment);
router.post('/:id/payment-request', protect, uploadScreenshot.single('screenshot'), submitPaymentRequest);
router.put('/:id/payment-request/:reqId/approve', protect, adminOnly, approvePaymentRequest);
router.put('/:id/payment-request/:reqId/reject', protect, adminOnly, rejectPaymentRequest);
router.post('/', protect, adminOnly, createFeeRecord);

module.exports = router;

