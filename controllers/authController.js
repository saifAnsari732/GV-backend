const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Course=require('../models/Course')
// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    // Check if it's JSON or FormData
    let courseIdentifier;
    let name, email, password, phone, address, dateOfBirth, role;
    
    if (req.is('json')) {
      // JSON request (ThunderClient)
      ({ name, email, password, phone, address, dateOfBirth, courseNames, courseIds, role } = req.body);
      courseIdentifier = courseIds || courseNames;
      console.log("JSON request received with courseIdentifier:", courseIdentifier);
    } else {
      // FormData request (Browser)
      name = req.body.name;
      email = req.body.email;
      password = req.body.password;
      phone = req.body.phone;
      address = req.body.address;
      dateOfBirth = req.body.dateOfBirth;
      role = req.body.role;
      courseIdentifier = req.body.courseIds || req.body.courseNames;
      console.log("FormData request received with courseIdentifier:", courseIdentifier);
    }
    
    console.log("Request body:", req.body);
    
    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Process enrolled courses if courseIdentifier is provided
    let enrolledCourses = [];
    if (courseIdentifier) {
      const courseIdArray = Array.isArray(courseIdentifier) ? courseIdentifier : [courseIdentifier];
      console.log("Course ID array:", courseIdArray);
      
      // Find courses by IDs
      const courses = await Course.find({
        _id: { $in: courseIdArray }
      });

      console.log("Found courses:", courses);

      if (courses.length > 0) {
        enrolledCourses = courses.map(course => ({
          course: course._id,
          enrollmentDate: new Date(),
          status: 'active'
        }));
      }
    }

    // Create user with enrolled courses
    const user = await User.create({
      name,
      email,
      password,
      phone,
      address,
      dateOfBirth,
      role: role || 'student',
      profileImage: req.file ? req.file.filename : 'default-avatar.jpg',
      courseNames: enrolledCourses
    });

    // Populate course details for response
    const populatedUser = await User.findById(user._id).populate('courseNames.course', 'courseName courseCode fees');

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { 
        user: {
          id: populatedUser._id,
          name: populatedUser.name,
          email: populatedUser.email,
          role: populatedUser.role,
          profileImage: populatedUser.profileImage,
          enrolledCourses: populatedUser.courseNames.map(ec => ({
            courseId: ec.course?._id,
            courseName: ec.course?.courseName,
            courseCode: ec.course?.courseCode,
            fees: ec.course?.fees,
            enrollmentDate: ec.enrollmentDate,
            status: ec.status
          }))
        },
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact admin.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage
        },
        token: generateToken(user._id)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('courseNames.course', 'courseName courseCode fees')
      .select('-password');

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    
    const updateData = { name, phone, address };
    if (req.file) {
      updateData.profileImage = req.file.filename;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
