const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, updateProfileImage } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const upload = require('../config/multer');

router.post('/register', upload.single('profileImage'), register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, upload.single('profileImage'), updateProfile);
router.put('/profile/image', protect, upload.single('profileImage'), updateProfileImage);

module.exports = router;
