/**
 * Free Task Routes
 * Routes for the free task system that helps workers earn badges
 */

const express = require('express');
const router = express.Router();

// Import controllers
const {
  createFreeTask,
  getFreeTasks,
  selectFreeTaskWinners,
  getEmployerFreeTaskAnalytics
} = require('../controllers/freeTaskController');

// Import middleware
const authMiddleware = require('../middleware/auth');

/**
 * @route   POST /api/free-tasks
 * @desc    Create a free task for new employers
 * @access  Protected (Employer)
 * @body    employerId, title, description, category, duration, skillTags, difficulty
 */
router.post('/',
  authMiddleware.authenticateToken,
  createFreeTask
);

/**
 * @route   GET /api/free-tasks
 * @desc    Get available free tasks for workers
 * @access  Public (but workerId in query for personalization)
 * @query   category, workerId, difficulty
 */
router.get('/', getFreeTasks);

/**
 * @route   POST /api/free-tasks/:taskId/select-winners
 * @desc    Select winners for a free task and award badges
 * @access  Protected (Employer)
 * @body    selectedApplicationIds[]
 */
router.post('/:taskId/select-winners',
  authMiddleware.authenticateToken,
  selectFreeTaskWinners
);

/**
 * @route   GET /api/free-tasks/employer/:employerId/analytics
 * @desc    Get employer's free task analytics
 * @access  Protected (Employer)
 */
router.get('/employer/:employerId/analytics',
  authMiddleware.authenticateToken,
  getEmployerFreeTaskAnalytics
);

module.exports = router;