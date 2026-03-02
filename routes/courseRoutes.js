const express = require('express');
const router = express.Router();
const {
  getAllCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse
} = require('../controllers/courseController');
const { protect, adminOnly } = require('../middleware/auth');
const upload = require('../config/multer');

router.route('/')
  .get(getAllCourses)
  .post(protect, adminOnly, upload.single('courseImage'), createCourse);

router.route('/:id')
  .get(getCourse)
  .put(protect, adminOnly, upload.single('courseImage'), updateCourse)
  .delete(protect, adminOnly, deleteCourse);

  // router.route('/:id')
  // .get(getCourse)
 


module.exports = router;
