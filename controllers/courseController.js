const Course = require('../models/Course');
const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// @desc    Get all courses
// @route   GET /api/courses
// @access  Public
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single course
// @route   GET /api/courses/:id
// @access  Public
// exports.getCourse = async (req, res) => {
//   try {
//     const course = await Course.findById(req.params.id);

//     if (!course) {
//       return res.status(404).json({
//         success: false,
//         message: 'Course not found'
//       });
//     }

//     res.status(200).json({
//       success: true,
//       data: course
//     });
//   } catch (error) {
//     res.status(500).json({
//       success: false,
//       message: error.message
//     });
//   }
// };

exports.getCourse = async (req, res) => {
  console.log("getCourse called with params:", req.params);
  
  try {
    // Use 'id' instead of 'courseName' since that's what's in the route
    const { id } = req.params;
    
    console.log("Searching for course with identifier:", id);
    
    // Check if it's a valid MongoDB ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    
    let course;
    
    if (isValidObjectId) {
      // Search by ID
      console.log("Searching by ID...");
      course = await Course.findById(id);
    } else {
      // Search by name (case insensitive)
      console.log("Searching by name...");
      course = await Course.find({ 
        courseName: { $regex: new RegExp('^' + id + '$', 'i') } 
      });
      
      // If not found, try contains match
      if (!course) {
        console.log("Exact name match not found, trying contains match...");
        course = await Course.findOne({ 
          courseName: { $regex: new RegExp(id, 'i') } 
        });
      }
    }

    if (!course) {
      // Get all courses for debugging
      const allCourses = await Course.find({}).select('courseName courseCode');
      
      return res.status(404).json({
        success: false,
        message: 'Course not found',
        debug: {
          searchedFor: id,
          availableCourses: allCourses.map(c => c.courseName)
        }
      }); 
    }

    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error("Error in getCourse:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create course
// @route   POST /api/courses
// @access  Private/Admin

exports.createCourse = async (req, res) => {
  try {
    console.log('\n=== CREATE COURSE (MULTER) ===');
    console.log('Body:', req.body);
    console.log('File:', req.file);

    const courseData = {
      courseName: req.body.courseName,
      courseCode: req.body.courseCode,
      duration: req.body.duration,
      fees: req.body.fees,
      category: req.body.category || 'Other',
      syllabus: [],
      courseImage:''
    };

    // Parse syllabus if it's a string
    if (req.body.syllabus) {
      if (typeof req.body.syllabus === 'string') {
        try {
          courseData.syllabus = JSON.parse(req.body.syllabus);
          console.log('Parsed syllabus:', courseData.syllabus);
        } catch (parseError) {
          console.error('Syllabus parse error:', parseError);
          return res.status(400).json({
            success: false,
            message: 'Invalid syllabus format'
          });
        }
      } else {
        courseData.syllabus = req.body.syllabus;
      }
    }

    // Handle image upload with Multer
    if (req.file) {
      console.log('✅ File received from multer:', {
        originalname: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
        path: req.file.path
      });

      try {
        console.log('📤 Uploading to Cloudinary...');
        
        // Upload to Cloudinary
        const cloudinaryResponse = await cloudinary.uploader.upload(
          req.file.path,
          {
            folder: 'courses',
            resource_type: 'image',
            transformation: [
              { width: 800, height: 450, crop: 'limit' },
              { quality: 'auto' }
            ]
          }
        );

        console.log('✅ Cloudinary upload successful!');
        console.log('📸 Image URL:', cloudinaryResponse.secure_url);

        // IMPORTANT: Save Cloudinary URL to courseData
        // const courseImage=req.files.courseImage
        courseData.courseImage = cloudinaryResponse.secure_url;
        console.log('💾 courseImage added to courseData:', courseData.courseImage);

        // Delete temporary file
        try {
          fs.unlinkSync(req.file.path);
          console.log('🗑️  Temporary file deleted');
        } catch (unlinkError) {
          console.error('⚠️  Could not delete temp file:', unlinkError.message);
        }

      } catch (cloudinaryError) {
        console.error('❌ Cloudinary error:', cloudinaryError);
        
        // Clean up temp file on error
        if (fs.existsSync(req.file.path)) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (e) {
            console.error('Could not delete temp file on error:', e);
          }
        }
        
        return res.status(500).json({
          success: false,
          message: 'Error uploading image to Cloudinary',
          error: cloudinaryError.message
        });
      }
    } else {
      console.log('⚠️  No file uploaded');
      // Set default or empty courseImage
      courseData.courseImage = '';
    }

    console.log('\n📋 Final courseData before saving:');
    console.log(JSON.stringify(courseData, null, 2));

    // Create course in database
    const course = await Course.create(courseData);

    console.log('✅ Course created successfully!');
    console.log('🆔 Course ID:', course._id);
    console.log('📸 Saved courseImage:', course.courseImage);

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: course
    });

  } catch (error) {
    console.error('❌ Create course error:', error);
    console.error('Error stack:', error.stack);
    
    // Clean up temp file if exists
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error('Could not delete temp file:', e);
      }
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create course',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private/Admin
exports.updateCourse = async (req, res) => {
  try {
    console.log('\n=== UPDATE COURSE (MULTER) ===');
    console.log('Course ID:', req.params.id);
    console.log('Body:', req.body);
    console.log('File:', req.file);

    let course = await Course.findById(req.params.id);

    if (!course) {
      // Clean up uploaded file if course doesn't exist
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    const updateData = {
      courseName: req.body.courseName,
      courseCode: req.body.courseCode,
      duration: req.body.duration,
      fees: req.body.fees,
      category: req.body.category || 'Other'
    };

    // Parse syllabus if it's a string
    if (req.body.syllabus) {
      if (typeof req.body.syllabus === 'string') {
        try {
          updateData.syllabus = JSON.parse(req.body.syllabus);
        } catch (parseError) {
          console.error('Syllabus parse error:', parseError);
          
          // Clean up temp file
          if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
          }
          
          return res.status(400).json({
            success: false,
            message: 'Invalid syllabus format'
          });
        }
      } else {
        updateData.syllabus = req.body.syllabus;
      }
    }

    // Handle new image upload
    if (req.file) {
      console.log('New image uploaded');

      try {
        // Upload new image to Cloudinary
        const cloudinaryResponse = await cloudinary.uploader.upload(
          req.file.path,
          {
            folder: 'courses',
            resource_type: 'image',
            transformation: [
              { width: 800, height: 450, crop: 'limit' },
              { quality: 'auto' }
            ]
          }
        );

        console.log('New image uploaded to Cloudinary');

        // Delete old image from Cloudinary if exists
        if (course.courseImage && course.courseImage.includes('cloudinary')) {
          try {
            const urlParts = course.courseImage.split('/');
            const filename = urlParts[urlParts.length - 1];
            const publicIdWithExt = filename.split('.')[0];
            const publicId = `courses/${publicIdWithExt}`;

            await cloudinary.uploader.destroy(publicId);
            console.log('Old image deleted from Cloudinary');
          } catch (deleteError) {
            console.error('Error deleting old image:', deleteError);
          }
        }

        updateData.courseImage = cloudinaryResponse.secure_url;

        // Delete temporary file
        fs.unlinkSync(req.file.path);

      } catch (cloudinaryError) {
        console.error('Cloudinary error:', cloudinaryError);
        
        // Clean up temp file
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        
        return res.status(500).json({
          success: false,
          message: 'Error uploading image to Cloudinary',
          error: cloudinaryError.message
        });
      }
    }

    console.log('Updating course with data:', updateData);

    course = await Course.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    console.log('Course updated successfully');

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: course
    });

  } catch (error) {
    console.error('Update course error:', error);
    
    // Clean up temp file if exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update course'
    });
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private/Admin
exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Delete image from Cloudinary if exists
    if (course.courseImage && course.courseImage.includes('cloudinary')) {
      try {
        const urlParts = course.courseImage.split('/');
        const filename = urlParts[urlParts.length - 1];
        const publicIdWithExt = filename.split('.')[0];
        const publicId = `courses/${publicIdWithExt}`;

        await cloudinary.uploader.destroy(publicId);
        console.log('Image deleted from Cloudinary');
      } catch (deleteError) {
        console.error('Error deleting image:', deleteError);
      }
    }

    // Soft delete
    course.isActive = false;
    await course.save();

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};