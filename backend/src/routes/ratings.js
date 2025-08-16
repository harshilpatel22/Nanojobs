/**
 * Rating Routes - Star-based mutual rating system
 * Handles all rating-related API endpoints
 */

const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication to all rating routes
router.use(authenticateToken);

/**
 * @route   POST /api/ratings/submit
 * @desc    Submit a star rating for a completed task
 * @access  Private (Workers & Employers)
 * @body    { applicationId: string, stars: number (1-5) }
 */
router.post('/submit', ratingController.submitRating);

/**
 * @route   GET /api/ratings/:userId
 * @desc    Get all ratings for a specific user
 * @access  Private
 * @params  userId: User ID
 * @query   userType: WORKER | EMPLOYER
 */
router.get('/:userId', ratingController.getRatings);

/**
 * @route   GET /api/ratings/overview/:userId
 * @desc    Get rating overview for task acceptance decisions
 * @access  Private
 * @params  userId: User ID
 * @query   userType: WORKER | EMPLOYER
 */
router.get('/overview/:userId', ratingController.getRatingOverview);

/**
 * @route   GET /api/ratings/can-rate/:applicationId
 * @desc    Check if current user can rate a specific task application
 * @access  Private
 * @params  applicationId: Task application ID
 */
router.get('/can-rate/:applicationId', ratingController.checkCanRate);

/**
 * @route   GET /api/ratings/pending
 * @desc    Get tasks that current user can rate
 * @access  Private
 */
router.get('/pending', ratingController.getPendingRatings);

/**
 * @route   GET /api/ratings/statistics
 * @desc    Get platform-wide rating statistics
 * @access  Private (Admin only - TODO: add admin middleware)
 */
router.get('/statistics', ratingController.getRatingStatistics);

/**
 * @route   GET /api/ratings/details/:ratingId
 * @desc    Get detailed information about a specific rating
 * @access  Private (Admin only - TODO: add admin middleware)
 * @params  ratingId: Rating ID
 */
router.get('/details/:ratingId', ratingController.getRatingDetails);

/**
 * @route   PUT /api/ratings/:ratingId/visibility
 * @desc    Update rating visibility (hide/show rating)
 * @access  Private (Admin only - TODO: add admin middleware)
 * @params  ratingId: Rating ID
 * @body    { isVisible: boolean }
 */
router.put('/:ratingId/visibility', ratingController.updateRatingVisibility);

module.exports = router;