const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const enhancedTrialTaskController = require('../controllers/enhancedTrialTaskController');
const { auth } = require('../middleware/auth');

const router = express.Router();

/**
 * Enhanced Trial Task Routes - Production Ready
 * Dedicated routes for the skill verification microtask system
 * 
 * Features:
 * - Real-time trial task management
 * - Enhanced evaluation and feedback
 * - Payment integration for trial tasks (₹50-100)
 * - Progress tracking and analytics
 * - Badge progression based on performance
 */

/**
 * Validation middleware
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
 * TRIAL TASK MANAGEMENT ROUTES
 */

// Get available trial tasks with enhanced data
router.get('/',
  [
    query('category')
      .optional()
      .isIn(['DATA_ENTRY', 'CONTENT', 'ORGANIZATION', 'RESEARCH', 'COMMUNICATION'])
      .withMessage('Invalid trial task category'),
    
    query('includeAnalytics')
      .optional()
      .isBoolean()
      .withMessage('includeAnalytics must be boolean'),
    
    query('workerId')
      .optional()
      .isString()
      .withMessage('Worker ID must be a string')
  ],
  handleValidationErrors,
  enhancedTrialTaskController.getTrialTasks
);

// Submit trial task work with enhanced evaluation
router.post('/:taskId/submit',
  [
    param('taskId')
      .isString()
      .notEmpty()
      .withMessage('Task ID is required'),
    
    body('workerId')
      .optional() // Can be derived from session
      .isString()
      .withMessage('Worker ID must be a string'),
    
    body('workerData')
      .optional()
      .isObject()
      .withMessage('Worker data must be an object'),
    
    body('workerData.name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    
    body('workerData.phone')
      .optional()
      .isMobilePhone('en-IN')
      .withMessage('Please provide a valid Indian mobile number'),
    
    body('submittedWork')
      .isObject()
      .notEmpty()
      .withMessage('Submitted work data is required'),
    
    body('timeSpent')
      .isInt({ min: 0, max: 300 })
      .withMessage('Time spent must be between 0 and 300 minutes'),
    
    body('performanceMetrics')
      .optional()
      .isObject()
      .withMessage('Performance metrics must be an object')
  ],
  handleValidationErrors,
  enhancedTrialTaskController.submitTrialTask
);

// Get real-time feedback for ongoing trial task
router.get('/:taskId/feedback',
  [
    param('taskId')
      .isString()
      .notEmpty()
      .withMessage('Task ID is required'),
    
    query('workerId')
      .optional()
      .isString()
      .withMessage('Worker ID must be a string'),
    
    query('includeHints')
      .optional()
      .isBoolean()
      .withMessage('includeHints must be boolean')
  ],
  handleValidationErrors,
  enhancedTrialTaskController.getTrialTaskFeedback
);

/**
 * SUBMISSION AND PROGRESS ROUTES
 */

// Get trial task submissions for a worker
router.get('/submissions/:workerId',
  [
    param('workerId')
      .isString()
      .notEmpty()
      .withMessage('Worker ID is required'),
    
    query('includeAnalytics')
      .optional()
      .isBoolean()
      .withMessage('includeAnalytics must be boolean'),
    
    query('includeRecommendations')
      .optional()
      .isBoolean()
      .withMessage('includeRecommendations must be boolean')
  ],
  handleValidationErrors,
  enhancedTrialTaskController.getTrialTaskSubmissions
);

// Get trial task analytics (Admin/System)
router.get('/analytics',
  // TODO: Add admin authentication middleware when available
  // auth.requireAdmin,
  enhancedTrialTaskController.getTrialTaskAnalytics
);

/**
 * ADMIN ROUTES (Future Enhancement)
 */

// Create new trial task (Admin only)
router.post('/',
  // TODO: Add admin authentication middleware when available
  // auth.requireAdmin,
  [
    body('title')
      .trim()
      .isLength({ min: 5, max: 100 })
      .withMessage('Title must be between 5 and 100 characters'),
    
    body('description')
      .trim()
      .isLength({ min: 10, max: 1000 })
      .withMessage('Description must be between 10 and 1000 characters'),
    
    body('category')
      .isIn(['DATA_ENTRY', 'CONTENT', 'ORGANIZATION', 'RESEARCH', 'COMMUNICATION'])
      .withMessage('Invalid trial task category'),
    
    body('payAmount')
      .isFloat({ min: 50, max: 200 })
      .withMessage('Pay amount must be between ₹50 and ₹200'),
    
    body('timeLimit')
      .isInt({ min: 5, max: 60 })
      .withMessage('Time limit must be between 5 and 60 minutes'),
    
    body('difficulty')
      .optional()
      .isIn(['beginner', 'intermediate', 'advanced'])
      .withMessage('Difficulty must be beginner, intermediate, or advanced'),
    
    body('accuracyThreshold')
      .optional()
      .isFloat({ min: 60, max: 100 })
      .withMessage('Accuracy threshold must be between 60% and 100%'),
    
    body('instructions')
      .trim()
      .isLength({ min: 20, max: 2000 })
      .withMessage('Instructions must be between 20 and 2000 characters'),
    
    body('sampleData')
      .isObject()
      .withMessage('Sample data must be an object'),
    
    body('expectedOutput')
      .isObject()
      .withMessage('Expected output must be an object'),
    
    body('qualityChecklist')
      .optional()
      .isObject()
      .withMessage('Quality checklist must be an object')
  ],
  handleValidationErrors,
  enhancedTrialTaskController.createTrialTask
);

/**
 * HEALTH CHECK AND UTILITY ROUTES
 */

// Health check for trial task system
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Enhanced Trial Task System is operational',
    timestamp: new Date().toISOString(),
    version: '2.0',
    features: [
      'Real-time evaluation',
      'Payment integration',
      'Progress tracking',
      'Badge progression',
      'Performance analytics'
    ]
  });
});

// Get trial task system statistics
router.get('/stats', async (req, res) => {
  try {
    const { prisma } = require('../config/database');
    
    // Get basic stats
    const [totalTasks, totalSubmissions, activeWorkers] = await Promise.all([
      prisma.trialTask.count({ where: { isActive: true } }),
      prisma.trialTaskSubmission.count(),
      prisma.trialTaskSubmission.groupBy({
        by: ['workerId'],
        _count: { workerId: true }
      }).then(result => result.length)
    ]);

    // Calculate pass rate
    const passedSubmissions = await prisma.trialTaskSubmission.count({
      where: { passed: true }
    });
    
    const passRate = totalSubmissions > 0 ? (passedSubmissions / totalSubmissions) * 100 : 0;

    res.json({
      success: true,
      data: {
        totalTasks,
        totalSubmissions,
        activeWorkers,
        passRate: Math.round(passRate),
        systemStatus: 'operational',
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Trial task stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get trial task statistics'
    });
  }
});

/**
 * ERROR HANDLING MIDDLEWARE
 */
router.use((error, req, res, next) => {
  console.error('Trial task routes error:', error);
  
  res.status(error.status || 500).json({
    success: false,
    error: 'Trial task service error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An error occurred processing your request' 
      : error.message,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;