const express = require('express');
const router = express.Router();
const { createEnquiry, getAllEnquiries } = require('../controllers/enquiryController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/', createEnquiry);
router.get('/', protect, adminOnly, getAllEnquiries);

module.exports = router;
