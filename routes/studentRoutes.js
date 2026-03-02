const express = require('express');
const router = express.Router();
const {
  getAllStudents,
  getStudent,
  enrollStudent,
  updateStudent,
  deleteStudent
} = require('../controllers/studentController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', protect, adminOnly, getAllStudents);
router.get('/:id', protect, adminOnly, getStudent);
router.post('/:id/enroll', protect, adminOnly, enrollStudent);
router.put('/:id', protect, adminOnly, updateStudent);
router.delete('/:id', protect, adminOnly, deleteStudent);

module.exports = router;
