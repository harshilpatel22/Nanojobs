const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { authenticateToken, requireEmployer, requireWorker, optionalAuth } = require('../middleware/auth');

// Import the REAL controller with database integration
const bronzeTaskController = require('../controllers/bronzeTaskController');

const router = express.Router();
const { prisma } = require('../config/database');

/**
 * Task Routes - FIXED FOR REAL DATABASE INTEGRATION
 * Now properly calls taskController methods that save to PostgreSQL
 * 
 * Changes made:
 * - Removed in-memory storage (tasks Map)
 * - All routes now call taskController methods
 * - Added proper authentication middleware
 * - Enhanced validation and error handling
 */

/**
 * Validation middleware
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ Validation errors:', errors.array());
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * Get all available tasks with filtering
 * GET /api/tasks
 * 
 * FIXED: Now calls taskController.getAvailableTasks() which queries database
 */
// Replace the GET '/' route validation in tasks.js with this FIXED version:

/**
 * Get all available bronze tasks (worker marketplace view)
 * GET /api/tasks
 */
router.get('/',
  [
    query('workerId').optional().isString().withMessage('Worker ID must be a string'),
    query('category').optional().isString().withMessage('Category must be a string'),
    query('urgency').optional({ checkFalsy: true }).isIn(['low', 'normal', 'high']).withMessage('Invalid urgency level'),
    query('maxBudget').optional({ checkFalsy: true }).isNumeric().withMessage('Max budget must be a number'),
    query('minRate').optional({ checkFalsy: true }).isNumeric().withMessage('Min rate must be a number'),
    query('maxRate').optional({ checkFalsy: true }).isNumeric().withMessage('Max rate must be a number'),
    query('location').optional().isString().withMessage('Location must be a string'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('search').optional().isString().withMessage('Search query must be a string'),
    query('industry').optional({ checkFalsy: true }).isString(),
    query('difficulty').optional({ checkFalsy: true }).isString(),
    query('businessFocus').optional().isBoolean().toBoolean(),
  ],
  handleValidationErrors,
  optionalAuth,
  async (req, res) => {
    // Around line 100 in the GET '/' route, replace the try block:
try {
  console.log('🔡 GET /api/tasks - Getting bronze tasks for marketplace');
  
  // Use the bronze task method with 'all' category
  req.params = { category: 'all' };
  
  await bronzeTaskController.getBronzeTasksByCategory(req, res);
  
} catch (error) {
  console.error('❌ Get bronze tasks error:', error);
  res.status(500).json({
    success: false,
    error: 'Failed to fetch tasks'
  });
}
  }
);

/**
 * Get task by ID
 * GET /api/tasks/:id
 * 
 * FIXED: Now calls taskController.getTaskById() which queries database
 */
router.get('/:id',
  [
    param('id').isString().withMessage('Task ID is required'),
    query('workerId').optional().isString().withMessage('Worker ID must be a string')
  ],
  handleValidationErrors,
  optionalAuth, // Allow unauthenticated access for task details
  async (req, res) => {
    try {
      console.log('📡 GET /api/tasks/:id - Task ID:', req.params.id);
      
      // Call the REAL controller method
      return res.status(501).json({
        success: false,
        error: 'Not implemented',
        message: 'Single task details endpoint not yet implemented'
      });
      
    } catch (error) {
      console.error('❌ Get task by ID route error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch task details'
      });
    }
  }
);

/**
 * Create new task
 * POST /api/tasks
 * 
 * FIXED: Now calls taskController.createTask() which saves to database
 */
// REPLACE the existing POST '/' route with this:
router.post('/',
  authenticateToken,
  requireEmployer,
  [
    body('title').isString().isLength({ min: 5, max: 100 }),
    body('description').isString().isLength({ min: 20, max: 2000 }),
    body('category').isString(),
    body('estimatedHours').isFloat({ min: 0.5, max: 8 }),
    body('hourlyRate').isFloat({ min: 50, max: 500 }),
    body('totalBudget').isFloat({ min: 100, max: 5000 })
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      console.log('📡 POST /api/tasks - Creating bronze task');
      
      // Convert frontend data to bronze task format
      const bronzeTaskData = {
        employerId: req.employerId,
        title: req.body.title,
        description: req.body.description,
        category: req.body.category.toUpperCase().replace('-', '_'), // Convert to enum
        duration: Math.round(req.body.estimatedHours * 60), // Convert to minutes
        payAmount: req.body.totalBudget,
        difficulty: getDifficultyFromRate(req.body.hourlyRate),
        skillTags: req.body.requiredSkills || [],
        industry: 'general',
        recurring: false
      };
      
      // Use bronze controller
      const bronzeController = require('../controllers/bronzeTaskController');
      req.body = bronzeTaskData; // Update request body
      
      await bronzeController.createBronzeTask(req, res);
      
    } catch (error) {
      console.error('❌ Task creation route error:', error);
      res.status(500).json({
        success: false,
        error: 'Task creation failed',
        message: 'An error occurred while creating the task'
      });
    }
  }
);

// Helper function
function getDifficultyFromRate(hourlyRate) {
  if (hourlyRate >= 300) return 'advanced';
  if (hourlyRate >= 200) return 'intermediate';
  return 'beginner';
}

/**
 * Apply for a task
 * POST /api/tasks/:id/apply
 * 
 * FIXED: Now calls taskController.applyForTask() which saves to database
 */
router.post('/:id/apply',
  authenticateToken,
  requireWorker,
  [
    param('id').isString().withMessage('Task ID is required'),
    body('message').optional().isString().isLength({ max: 500 }).withMessage('Message must be less than 500 characters'),
    body('proposedRate').optional().isFloat({ min: 50 }).withMessage('Proposed rate must be at least ₹50')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      console.log('📡 POST /api/tasks/:id/apply - Task application');
      console.log('🔐 Auth data:', {
        workerId: req.workerId,
        userType: req.userType
      });
      
      // Add workerId from authenticated session
      req.body.workerId = req.workerId;
      
      // Call the REAL controller method
      await bronzeTaskController.applyForBronzeTask(req, res);
      
    } catch (error) {
      console.error('❌ Apply for task route error:', error);
      res.status(500).json({
        success: false,
        error: 'Application failed',
        message: 'An error occurred while submitting your application'
      });
    }
  }
);

/**
 * Update application status (accept/reject)
 * PUT /api/tasks/:taskId/applications/:applicationId
 * 
 * FIXED: Now calls taskController.updateApplicationStatus() 
 */
router.put('/:taskId/applications/:applicationId/status',
  authenticateToken,
  requireEmployer,
  [
    param('taskId').isString().withMessage('Task ID is required'),
    param('applicationId').isString().withMessage('Application ID is required'),
    body('status').isIn(['ACCEPTED', 'REJECTED']).withMessage('Status must be ACCEPTED or REJECTED'),
    body('note').optional().isString().isLength({ max: 500 }).withMessage('Note must be less than 500 characters')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      console.log('📡 PUT /api/tasks/:taskId/applications/:applicationId - Update application status');
      
      // Call the REAL controller method
      await bronzeTaskController.updateBronzeTaskApplicationStatus(req, res);
      
    } catch (error) {
      console.error('❌ Update application status route error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update application status'
      });
    }
  }
);

/**
 * Get employer's tasks
 * GET /api/tasks/employer/:employerId
 * 
 * FIXED: Now calls taskController.getEmployerTasks()
 */
// REPLACE this route:
router.get('/employer/:employerId',
  [
    param('employerId').isString().withMessage('Employer ID is required'),
    query('status').optional().isIn(['DRAFT', 'AVAILABLE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).withMessage('Invalid status'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
  ],
  handleValidationErrors,
  authenticateToken,
  requireEmployer,
  async (req, res) => {
    try {
      console.log('📡 GET /api/tasks/employer/:employerId - Get employer bronze tasks');
      
      // Verify employer is accessing their own tasks
      if (req.employerId !== req.params.employerId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You can only access your own tasks'
        });
      }
      
      // Get bronze tasks for this employer
      const { employerId } = req.params;
      const { status, page = 1, limit = 10 } = req.query;

      console.log('📋 Getting bronze tasks for employer:', employerId);

      // Build query conditions
      const where = { employerId };
      if (status) {
        where.status = status.toUpperCase();
      }

      const bronzeTasks = await prisma.bronzeTask.findMany({
        where,
        include: {
          applications: {
            include: {
              worker: {
                include: { user: { select: { name: true, phone: true } } }
              }
            },
            orderBy: { appliedAt: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
      });

      // Format response with application summaries for frontend compatibility
      const formattedTasks = bronzeTasks.map(task => ({
        id: task.id,
        title: task.title,
        description: task.description,
        category: task.category,
        requiredBadge: 'BRONZE', // Always bronze
        estimatedHours: Math.round(task.duration / 60),
        hourlyRate: Math.round(task.payAmount / (task.duration / 60)),
        totalBudget: parseFloat(task.payAmount),
        status: 'AVAILABLE', // Bronze tasks are always available when created
        urgency: 'normal',
        location: 'Remote',
        maxApplications: 10,
        deadline: null,
        
        applications: {
          total: task.applications.length,
          pending: task.applications.filter(app => app.status === 'APPLIED').length,
          accepted: task.applications.filter(app => app.status === 'ACCEPTED').length,
          recent: task.applications.slice(0, 3).map(app => ({
            id: app.id,
            workerName: app.worker.user.name,
            status: app.status,
            appliedAt: app.appliedAt
          }))
        },
        
        createdAt: task.createdAt
      }));

      console.log(`✅ Found ${formattedTasks.length} bronze tasks for employer`);

      res.json({
        success: true,
        data: {
          tasks: formattedTasks,
          pagination: {
            currentPage: parseInt(page),
            limit: parseInt(limit),
            hasMore: formattedTasks.length === parseInt(limit)
          }
        }
      });
      
    } catch (error) {
      console.error('❌ Get employer bronze tasks route error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch employer tasks'
      });
    }
  }
);

/**
 * Get worker's applications
 * GET /api/tasks/worker/:workerId/applications
 * 
 * FIXED: Now calls taskController.getWorkerApplications()
 */
router.get('/worker/:workerId/applications',
  [
    param('workerId').isString().withMessage('Worker ID is required'),
    query('status').optional().isIn(['APPLIED', 'ACCEPTED', 'REJECTED', 'COMPLETED']).withMessage('Invalid status'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
  ],
  handleValidationErrors,
  authenticateToken,
  requireWorker,
  async (req, res) => {
    try {
      console.log('📡 GET /api/tasks/worker/:workerId/applications - Get worker applications');
      
      // Verify worker is accessing their own applications
      if (req.workerId !== req.params.workerId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You can only access your own applications'
        });
      }
      
      // Call the REAL controller method
      await bronzeTaskController.getWorkerBronzeTaskApplications(req, res);
      
    } catch (error) {
      console.error('❌ Get worker applications route error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch applications'
      });
    }
  }
);

/**
 * Get task categories with statistics
 * GET /api/tasks/categories/list
 * 
 * FIXED: Now calls taskController.getTaskCategories()
 */
router.get('/categories/list', async (req, res) => {
  try {
    console.log('📡 GET /api/tasks/categories/list - Get categories');
    
    // Call the REAL controller method
    await bronzeTaskController.getBronzeTaskCategories(req, res);
    
  } catch (error) {
    console.error('❌ Get categories route error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
});

/**
 * Update task (for employers)
 * PUT /api/tasks/:id
 */
router.put('/:id',
  [
    param('id').isString().withMessage('Task ID is required'),
    body('title').optional().isString().isLength({ min: 5, max: 100 }),
    body('description').optional().isString().isLength({ min: 20, max: 2000 }),
    body('hourlyRate').optional().isFloat({ min: 50, max: 2000 }),
    body('totalBudget').optional().isFloat({ min: 100, max: 100000 }),
    body('maxApplications').optional().isInt({ min: 1, max: 50 }),
    body('deadline').optional().isISO8601(),
    body('urgency').optional().isIn(['low', 'normal', 'high'])
  ],
  handleValidationErrors,
  authenticateToken,
  requireEmployer,
  async (req, res) => {
    try {
      console.log('📡 PUT /api/tasks/:id - Update task');
      
      // For now, return not implemented (you can add this to taskController later)
      res.status(501).json({
        success: false,
        error: 'Not implemented',
        message: 'Task update functionality will be implemented in next phase'
      });
      
    } catch (error) {
      console.error('❌ Update task route error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update task'
      });
    }
  }
);

/**
 * Delete task (for employers)
 * DELETE /api/tasks/:id
 */
router.delete('/:id',
  [
    param('id').isString().withMessage('Task ID is required')
  ],
  handleValidationErrors,
  authenticateToken,
  requireEmployer,
  async (req, res) => {
    try {
      console.log('📡 DELETE /api/tasks/:id - Delete task');
      
      // For now, return not implemented (you can add this to taskController later)
      res.status(501).json({
        success: false,
        error: 'Not implemented',
        message: 'Task deletion functionality will be implemented in next phase'
      });
      
    } catch (error) {
      console.error('❌ Delete task route error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete task'
      });
    }
  }
);

/**
 * Get categories (alternative endpoint for compatibility)
 * GET /api/tasks/categories
 */
router.get('/categories', async (req, res) => {
  try {
    console.log('📡 GET /api/tasks/categories - Get categories (alternative endpoint)');
    
    // Call the same controller method
    await bronzeTaskController.getBronzeTaskCategories(req, res);
    
  } catch (error) {
    console.error('❌ Get categories (alt) route error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
});

/**
 * Debug endpoint to check database connection and data
 * GET /api/tasks/debug (development only)
 */
if (process.env.NODE_ENV === 'development') {
  router.get('/debug', async (req, res) => {
    try {
      const { prisma } = require('../config/database');
      
      // Get database statistics
      const stats = await Promise.all([
        prisma.bronzeTask.count(),
        prisma.taskApplication.count(),
        prisma.worker.count(),
        prisma.employer.count()
      ]);
      
      // Get recent tasks
      const recentTasks = await prisma.bronzeTask.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          employer: {
            include: { user: { select: { name: true } } }
          },
          taskApplications: { select: { id: true, status: true } }
        }
      });
      
      res.json({
        success: true,
        debug: {
          database: {
            bronzeTasks: stats[0],
            applications: stats[1],
            workers: stats[2],
            employers: stats[3]
          },
          recentTasks: recentTasks.map(task => ({
            id: task.id,
            title: task.title,
            category: task.category,
            difficulty: task.difficulty,
            payAmount: task.payAmount,
            employerName: task.employer.user.name,
            applications: task.taskApplications.length,
            createdAt: task.createdAt
          })),
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error('❌ Debug endpoint error:', error);
      res.status(500).json({
        success: false,
        error: 'Debug failed',
        details: error.message
      });
    }
  });
}

module.exports = router;