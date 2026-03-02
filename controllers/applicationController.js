const JobApplication = require('../models/JobApplication');
const Job = require('../models/Job');
const User = require('../models/User');

// Apply for a job
exports.applyForJob = async (req, res) => {
  try {
    const { 
      jobId, 
      applicantName, 
      applicantEmail, 
      applicantPhone, 
      resume, 
      coverLetter,
      experience,
      qualifications,
      expectedSalary 
    } = req.body;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if user has already applied
    const existingApplication = await JobApplication.findOne({
      jobId,
      userId: req.user.id
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied for this job'
      });
    }

    // Create new application
    const application = new JobApplication({
      jobId,
      userId: req.user.id,
      applicantName,
      applicantEmail,
      applicantPhone,
      resume,
      coverLetter,
      experience,
      qualifications,
      expectedSalary
    });

    await application.save();

    // Populate job details for response
    await application.populate('jobId', 'title company location');

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application
    });

  } catch (error) {
    console.error('Application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit application',
      error: error.message
    });
  }
};

// Get user's applications
exports.getUserApplications = async (req, res) => {
  try {
    const applications = await JobApplication.find({ userId: req.user.id })
      .populate('jobId', 'title company location salary jobType')
      .sort({ appliedAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message
    });
  }
};

// Get single application details
exports.getApplicationById = async (req, res) => {
  try {
    const application = await JobApplication.findById(req.params.id)
      .populate('jobId')
      .populate('userId', 'name email');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check if user owns this application or is admin
    if (application.userId._id.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this application'
      });
    }

    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch application',
      error: error.message
    });
  }
};

// Admin: Get all applications for a job
exports.getJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;

    const applications = await JobApplication.find({ jobId })
      .populate('userId', 'name email')
      .sort({ appliedAt: -1 });

    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message
    });
  }
};

// Admin: Update application status
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { status, notes } = req.body;

    const application = await JobApplication.findByIdAndUpdate(
      req.params.id,
      { status, notes },
      { new: true, runValidators: true }
    );

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Application status updated',
      data: application
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update application',
      error: error.message
    });
  }
};

// Admin: Get all applications (with filters)
exports.getAllApplications = async (req, res) => {
  try {
    const { status, jobId, page = 1, limit = 10 } = req.query;
    
    const query = {};
    if (status) query.status = status;
    if (jobId) query.jobId = jobId;

    const applications = await JobApplication.find(query)
      .populate('jobId', 'title company location')
      .populate('userId', 'name email')
      .sort({ appliedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await JobApplication.countDocuments(query);

    res.status(200).json({
      success: true,
      data: applications,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message
    });
  }
};