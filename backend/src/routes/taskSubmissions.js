/**
 * Task Submission Routes
 * Handles all routes related to task submissions by workers
 */

const express = require('express');
const router = express.Router();

// Import controllers
const taskSubmissionController = require('../controllers/taskSubmissionController');

// Import middleware
const authMiddleware = require('../middleware/auth');
const { handleTaskSubmissions } = require('../middleware/taskFileUpload');

/**
 * @route   POST /api/task-submissions/:applicationId
 * @desc    Submit work for an accepted task
 * @access  Protected (Worker)
 * @files   submissions[] - Array of submission files (optional)
 * @body    submissionType, textContent, links, fileDescriptions
 */
router.post('/:applicationId', 
  authMiddleware.authenticateToken,
  handleTaskSubmissions,
  taskSubmissionController.createTaskSubmission
);

/**
 * @route   GET /api/task-submissions/:submissionId
 * @desc    Get submission details
 * @access  Protected (Worker/Employer)
 * @query   userId - For access control
 */
router.get('/:submissionId', 
  authMiddleware.authenticateToken,
  taskSubmissionController.getTaskSubmission
);

/**
 * @route   PUT /api/task-submissions/:submissionId/review
 * @desc    Review submission (Employer only)
 * @access  Protected (Employer)
 * @query   userId - Employer's user ID
 * @body    status, reviewNote
 */
router.put('/:submissionId/review', 
  authMiddleware.authenticateToken,
  taskSubmissionController.reviewTaskSubmission
);

/**
 * @route   GET /api/task-submissions/:submissionId/files/:fileId/download
 * @desc    Download submission file
 * @access  Protected (Worker/Employer)
 * @query   userId - For access control
 */
router.get('/:submissionId/files/:fileId/download', 
  authMiddleware.authenticateToken,
  taskSubmissionController.downloadSubmissionFile
);

module.exports = router;