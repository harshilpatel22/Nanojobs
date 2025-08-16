const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const workerController = require('../controllers/workerController');
const { resumeUpload } = require('../middleware/upload');

const router = express.Router();

/**
 * Validation middleware to handle express-validator errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: 'Please check your input data',
      details: errors.array()
    });
  }
  next();
};

/**
 * Worker Registration Routes
 */

// Register worker with resume upload
router.post('/register-with-resume',
  // File upload middleware
  resumeUpload,
  
  // Validation rules
  [
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('Name can only contain letters and spaces'),
    
    body('phone')
      .trim()
      .isMobilePhone('en-IN')
      .withMessage('Please provide a valid Indian mobile number'),
    
    body('email')
      .optional()
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address')
  ],
  
  handleValidationErrors,
  workerController.registerWithResume
);

// Register worker with quiz assessment
router.post('/register-with-quiz',
  [
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('Name can only contain letters and spaces'),
    
    body('phone')
      .trim()
      .isMobilePhone('en-IN')
      .withMessage('Please provide a valid Indian mobile number'),
    
    body('email')
      .optional()
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    
    body('answers')
      .isArray({ min: 1 })
      .withMessage('Quiz answers are required'),
    
    body('timeTaken')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Time taken must be a positive number')
  ],
  
  handleValidationErrors,
  workerController.registerWithQuiz
);

/**
 * Quiz Assessment Routes
 */

// Get skill assessment questions
router.get('/quiz-questions',
  [
    query('category')
      .optional()
      .isString()
      .withMessage('Category must be a string')
  ],
  handleValidationErrors,
  workerController.getQuizQuestions
);

/**
 * Worker Profile Management Routes
 */

// Get worker profile by ID
// Replace your existing GET /:id route with this debug version

// Get worker profile by ID
router.get('/:id',
  [
    param('id')
      .custom((value) => {
        console.log('🔍 ROUTE DEBUG - Validating ID:', value);
        console.log('🔍 ROUTE DEBUG - ID type:', typeof value);
        console.log('🔍 ROUTE DEBUG - ID length:', value?.length);
        
        // More flexible validation - cuid can be 25 characters, but let's be flexible
        if (!value || typeof value !== 'string' || value.length < 10) {
          console.log('❌ ROUTE DEBUG - ID validation failed');
          throw new Error('Invalid worker ID format');
        }
        
        console.log('✅ ROUTE DEBUG - ID validation passed');
        return true;
      })
      .withMessage('Invalid worker ID format')
  ],
  
  // Enhanced validation error handler
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ ROUTE VALIDATION ERRORS:', errors.array());
      console.log('📝 ROUTE REQUEST PARAMS:', req.params);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid worker ID provided',
        details: errors.array()
      });
    }
    console.log('✅ ROUTE DEBUG - Validation passed, calling controller');
    next();
  },
  
  workerController.getWorkerProfile
);

// Update worker profile
router.put('/:id',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid worker ID format'),
    
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    
    body('email')
      .optional()
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    
    body('skills')
      .optional()
      .isArray()
      .withMessage('Skills must be an array'),
    
    body('availability')
      .optional()
      .isIn(['available', 'busy', 'offline'])
      .withMessage('Availability must be available, busy, or offline'),
    
    body('preferredTaskCategories')
      .optional()
      .isArray()
      .withMessage('Preferred task categories must be an array')
  ],
  handleValidationErrors,
  workerController.updateWorkerProfile
);

/**
 * Worker Listing and Search Routes
 */

// Get all workers (with filtering and pagination)
router.get('/',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('badge')
      .optional()
      .isIn(['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'])
      .withMessage('Badge must be BRONZE, SILVER, GOLD, or PLATINUM'),
    
    query('status')
      .optional()
      .isIn(['active', 'inactive', 'suspended'])
      .withMessage('Status must be active, inactive, or suspended')
  ],
  handleValidationErrors,
  workerController.getAllWorkers
);

/**
 * Session Management Routes
 */

// Verify session token
router.get('/verify-session',
  [
    query('token')
      .notEmpty()
      .withMessage('Session token is required')
      .isUUID()
      .withMessage('Invalid session token format')
  ],
  handleValidationErrors,
  workerController.verifySession
);

/**
 * Worker Statistics and Analytics Routes
 */

// Get worker dashboard stats
router.get('/:id/stats',
  [
    param('id')
      .isUUID()
      .withMessage('Invalid worker ID format')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { prisma } = require('../config/database');
      const { id } = req.params;
      
      const worker = await prisma.worker.findUnique({
        where: { id },
        include: {
          taskApplications: {
            include: { task: true }
          }
        }
      });
      
      if (!worker) {
        return res.status(404).json({
          success: false,
          error: 'Worker not found'
        });
      }
      
      res.json({
        success: true,
        data: {
          workerId: id,
          stats: {
            tasksCompleted: worker.tasksCompleted,
            totalEarnings: parseFloat(worker.totalEarnings),
            averageRating: worker.averageRating ? parseFloat(worker.averageRating) : 0,
            currentBadge: worker.badge,
            tasksInProgress: worker.taskApplications.filter(app => app.status === 'ACCEPTED').length,
            weeklyEarnings: 0, // Calculate based on recent completions
            monthlyEarnings: 0, // Calculate based on recent completions
            completionRate: worker.tasksCompleted > 0 ? 100 : 0 // Calculate actual completion rate
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch statistics'
      });
    }
  }
);

/**
 * Worker Badge and Skills Routes
 */

// Get available badges information
router.get('/badges', (req, res) => {
  try {
    const badgeInfo = {
      BRONZE: {
        name: 'Bronze',
        level: 1,
        color: '#CD7F32',
        hourlyRange: '₹100-150',
        description: 'Entry Level - Perfect for getting started',
        requirements: 'Basic skills, willingness to learn',
        taskTypes: ['Data Entry', 'Simple Content Writing', 'Basic Research']
      },
      SILVER: {
        name: 'Silver',
        level: 2,
        color: '#C0C0C0',
        hourlyRange: '₹200-300',
        description: 'Skilled Worker - Growing expertise',
        requirements: '1-3 years experience, specific technical skills',
        taskTypes: ['Content Writing', 'Virtual Assistant', 'Social Media Management']
      },
      GOLD: {
        name: 'Gold',
        level: 3,
        color: '#FFD700',
        hourlyRange: '₹350-450',
        description: 'Expert Level - Advanced capabilities',
        requirements: '3-7 years experience, advanced skills, leadership',
        taskTypes: ['Web Development', 'Graphic Design', 'Digital Marketing']
      },
      PLATINUM: {
        name: 'Platinum',
        level: 4,
        color: '#E5E4E2',
        hourlyRange: '₹500+',
        description: 'Master Level - Premium expertise',
        requirements: '7+ years experience, expert skills, strategic thinking',
        taskTypes: ['Complex Development', 'Consulting', 'Project Management']
      }
    };
    
    res.json({
      success: true,
      data: { badges: badgeInfo }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch badge information'
    });
  }
});

// Get available task categories
router.get('/task-categories', (req, res) => {
  try {
    const categories = [
      {
        id: 'data-entry',
        name: 'Data Entry',
        description: 'Simple data input and processing tasks',
        badgeRequired: 'BRONZE',
        averageRate: 120,
        estimatedTime: '1-2 hours'
      },
      {
        id: 'content-writing',
        name: 'Content Writing',
        description: 'Blog posts, articles, and copywriting',
        badgeRequired: 'SILVER',
        averageRate: 250,
        estimatedTime: '2-3 hours'
      },
      {
        id: 'virtual-assistant',
        name: 'Virtual Assistant',
        description: 'Administrative and support tasks',
        badgeRequired: 'SILVER',
        averageRate: 200,
        estimatedTime: '1-3 hours'
      },
      {
        id: 'graphic-design',
        name: 'Graphic Design',
        description: 'Logo design, graphics, and visual content',
        badgeRequired: 'GOLD',
        averageRate: 400,
        estimatedTime: '2-4 hours'
      },
      {
        id: 'web-development',
        name: 'Web Development',
        description: 'Website development and programming',
        badgeRequired: 'GOLD',
        averageRate: 500,
        estimatedTime: '3-8 hours'
      }
    ];
    
    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch task categories'
    });
  }
});

/**
 * Error handling middleware for this router
 */
router.use((error, req, res, next) => {
  console.error('Worker routes error:', error);
  
  res.status(error.status || 500).json({
    success: false,
    error: 'Worker service error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An error occurred processing your request' 
      : error.message
  });
});

// ADD THESE ROUTES TO YOUR EXISTING workers.js routes file

/**
 * Trial Task Routes - Replace Quiz System
 */

// Register worker with trial tasks (Simple Form Path)
router.post('/register-with-trial-tasks',
  [
    body('name')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters')
      .matches(/^[a-zA-Z\s]+$/)
      .withMessage('Name can only contain letters and spaces'),
    
    body('phone')
      .trim()
      .isMobilePhone('en-IN')
      .withMessage('Please provide a valid Indian mobile number'),
    
    body('email')
      .optional()
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),

    body('educationLevel')
      .isIn(['10th', '12th', 'diploma', 'graduate', 'postgraduate', 'other'])
      .withMessage('Please select a valid education level'),
    
    body('availableHours')
      .isInt({ min: 1, max: 12 })
      .withMessage('Available hours must be between 1 and 12'),
    
    body('previousWork')
      .optional()
      .isString()
      .isLength({ max: 500 })
      .withMessage('Previous work description must be less than 500 characters'),
    
    body('trialTaskResults')
      .isArray({ min: 1 })
      .withMessage('Trial task results are required'),

    body('trialTaskResults.*.taskId')
      .isString()
      .withMessage('Each trial result must have a task ID'),

    body('trialTaskResults.*.evaluation')
      .isObject()
      .withMessage('Each trial result must have evaluation data'),

    body('trialTaskResults.*.evaluation.passed')
      .isBoolean()
      .withMessage('Each trial result must have pass/fail status')
  ],
  
  handleValidationErrors,
  workerController.registerWithTrialTasks
);

// Get available trial tasks
router.get('/trial-tasks',
  [
    query('category')
      .optional()
      .isIn(['DATA_ENTRY', 'CONTENT', 'ORGANIZATION', 'RESEARCH', 'COMMUNICATION'])
      .withMessage('Invalid trial task category')
  ],
  handleValidationErrors,
  workerController.getTrialTasks
);

// Submit trial task work
router.post('/trial-tasks/:taskId/submit',
  [
    param('taskId')
      .isString()
      .withMessage('Task ID is required'),
    
    body('workerId')
      .isString()
      .withMessage('Worker ID is required'),
    
    body('submittedWork')
      .isObject()
      .withMessage('Submitted work data is required'),
    
    body('timeSpent')
      .isInt({ min: 0 })
      .withMessage('Time spent must be a positive number')
  ],
  handleValidationErrors,
  workerController.submitTrialTask
);

// Get trial task submissions for a worker
router.get('/trial-tasks/submissions/:workerId',
  [
    param('workerId')
      .isString()
      .withMessage('Worker ID is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { workerId } = req.params;
      
      const submissions = await prisma.trialTaskSubmission.findMany({
        where: { workerId },
        include: {
          trialTask: {
            select: { title: true, category: true, payAmount: true }
          }
        },
        orderBy: { submittedAt: 'desc' }
      });

      const formattedSubmissions = submissions.map(sub => ({
        id: sub.id,
        taskTitle: sub.trialTask.title,
        category: sub.trialTask.category,
        payAmount: parseFloat(sub.trialTask.payAmount),
        timeSpent: sub.timeSpent,
        passed: sub.passed,
        accuracyScore: sub.accuracyScore,
        speedScore: sub.speedScore,
        qualityScore: sub.qualityScore,
        feedback: sub.feedback,
        submittedAt: sub.submittedAt
      }));

      res.json({
        success: true,
        data: {
          submissions: formattedSubmissions,
          totalSubmissions: submissions.length,
          passedSubmissions: submissions.filter(s => s.passed).length
        }
      });

    } catch (error) {
      console.error('Get trial submissions error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch trial submissions'
      });
    }
  }
);

// DEPRECATED: Keep for backward compatibility but mark as deprecated
router.get('/quiz-questions', 
  (req, res, next) => {
    console.warn('⚠️ DEPRECATED: /quiz-questions endpoint is deprecated. Use /trial-tasks instead.');
    next();
  },
  workerController.getQuizQuestions
);


module.exports = router;