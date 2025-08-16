/**
 * Rating Controller - Handles star-based mutual rating endpoints
 * 
 * Features:
 * - Submit 1-5 star ratings after task completion
 * - Get rating overviews for decision making
 * - View rating history and statistics
 * - Manage pending ratings
 */

const ratingService = require('../services/ratingService');
const { prisma } = require('../config/database');

class RatingController {
  
  /**
   * Submit a rating for a completed task
   * POST /api/ratings/submit
   */
  async submitRating(req, res) {
    try {
      console.log('🌟 Rating Controller: submitRating called');
      const { applicationId, stars } = req.body;
      const raterUserId = req.userId; // From auth middleware

      if (!applicationId || !stars) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Application ID and stars rating are required'
        });
      }

      if (typeof stars !== 'number' || stars < 1 || stars > 5 || !Number.isInteger(stars)) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Stars must be an integer between 1 and 5'
        });
      }

      const result = await ratingService.submitRating(applicationId, raterUserId, stars);

      if (result.success) {
        res.status(201).json({
          success: true,
          data: result.data,
          message: 'Rating submitted successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          message: result.message
        });
      }

    } catch (error) {
      console.error('❌ Rating Controller error in submitRating:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to submit rating'
      });
    }
  }

  /**
   * Get ratings for a user (worker or employer)
   * GET /api/ratings/:userId?userType=WORKER|EMPLOYER
   */
  async getRatings(req, res) {
    try {
      console.log('📊 Rating Controller: getRatings called');
      const { userId } = req.params;
      const { userType } = req.query;

      if (!userId || !userType) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'User ID and user type are required'
        });
      }

      if (!['WORKER', 'EMPLOYER'].includes(userType)) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'User type must be WORKER or EMPLOYER'
        });
      }

      const result = await ratingService.getRatings(userId, userType);

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: 'Ratings retrieved successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          error: result.error,
          message: result.message
        });
      }

    } catch (error) {
      console.error('❌ Rating Controller error in getRatings:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to get ratings'
      });
    }
  }

  /**
   * Get rating overview for task acceptance decisions
   * GET /api/ratings/overview/:userId?userType=WORKER|EMPLOYER
   */
  async getRatingOverview(req, res) {
    try {
      console.log('👀 Rating Controller: getRatingOverview called');
      const { userId } = req.params;
      const { userType } = req.query;

      if (!userId || !userType) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'User ID and user type are required'
        });
      }

      if (!['WORKER', 'EMPLOYER'].includes(userType)) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'User type must be WORKER or EMPLOYER'
        });
      }

      const result = await ratingService.getRatingOverview(userId, userType);

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: 'Rating overview retrieved successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          error: result.error,
          message: result.message
        });
      }

    } catch (error) {
      console.error('❌ Rating Controller error in getRatingOverview:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to get rating overview'
      });
    }
  }

  /**
   * Check if user can rate a specific task
   * GET /api/ratings/can-rate/:applicationId
   */
  async checkCanRate(req, res) {
    try {
      console.log('✅ Rating Controller: checkCanRate called');
      const { applicationId } = req.params;
      const raterUserId = req.userId; // From auth middleware

      if (!applicationId) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Application ID is required'
        });
      }

      const result = await ratingService.canUserRate(applicationId, raterUserId);

      res.json({
        success: true,
        data: result,
        message: 'Rating eligibility checked successfully'
      });

    } catch (error) {
      console.error('❌ Rating Controller error in checkCanRate:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to check rating eligibility'
      });
    }
  }

  /**
   * Get pending ratings for current user
   * GET /api/ratings/pending
   */
  async getPendingRatings(req, res) {
    try {
      console.log('⏳ Rating Controller: getPendingRatings called');
      const userId = req.userId; // From auth middleware

      const result = await ratingService.getPendingRatings(userId);

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: 'Pending ratings retrieved successfully'
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          message: result.message
        });
      }

    } catch (error) {
      console.error('❌ Rating Controller error in getPendingRatings:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to get pending ratings'
      });
    }
  }

  /**
   * Get platform rating statistics (admin only)
   * GET /api/ratings/statistics
   */
  async getRatingStatistics(req, res) {
    try {
      console.log('📈 Rating Controller: getRatingStatistics called');
      
      // TODO: Add admin authentication check here
      // if (!req.isAdmin) {
      //   return res.status(403).json({
      //     success: false,
      //     error: 'Access denied',
      //     message: 'Admin access required'
      //   });
      // }

      const result = await ratingService.getRatingStatistics();

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: 'Rating statistics retrieved successfully'
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error,
          message: result.message
        });
      }

    } catch (error) {
      console.error('❌ Rating Controller error in getRatingStatistics:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to get rating statistics'
      });
    }
  }

  /**
   * Get rating details by rating ID (for debugging/admin)
   * GET /api/ratings/details/:ratingId
   */
  async getRatingDetails(req, res) {
    try {
      console.log('🔍 Rating Controller: getRatingDetails called');
      const { ratingId } = req.params;

      if (!ratingId) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Rating ID is required'
        });
      }

      const rating = await prisma.rating.findUnique({
        where: { id: ratingId },
        include: {
          task: {
            select: { title: true, category: true }
          },
          application: {
            select: { status: true, completedAt: true }
          },
          workerRater: {
            include: { user: { select: { name: true, phone: true } } }
          },
          employerRater: {
            include: { user: { select: { name: true, phone: true } } }
          },
          workerRated: {
            include: { user: { select: { name: true, phone: true } } }
          },
          employerRated: {
            include: { user: { select: { name: true, phone: true } } }
          }
        }
      });

      if (!rating) {
        return res.status(404).json({
          success: false,
          error: 'Rating not found',
          message: 'No rating found with the provided ID'
        });
      }

      res.json({
        success: true,
        data: {
          rating: {
            id: rating.id,
            stars: rating.stars,
            raterType: rating.raterType,
            ratedAt: rating.ratedAt,
            isVisible: rating.isVisible,
            task: rating.task,
            application: rating.application,
            rater: rating.workerRater || rating.employerRater,
            rated: rating.workerRated || rating.employerRated
          }
        },
        message: 'Rating details retrieved successfully'
      });

    } catch (error) {
      console.error('❌ Rating Controller error in getRatingDetails:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to get rating details'
      });
    }
  }

  /**
   * Update rating visibility (admin only)
   * PUT /api/ratings/:ratingId/visibility
   */
  async updateRatingVisibility(req, res) {
    try {
      console.log('👁️ Rating Controller: updateRatingVisibility called');
      const { ratingId } = req.params;
      const { isVisible } = req.body;

      // TODO: Add admin authentication check
      // if (!req.isAdmin) {
      //   return res.status(403).json({
      //     success: false,
      //     error: 'Access denied',
      //     message: 'Admin access required'
      //   });
      // }

      if (!ratingId || typeof isVisible !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Rating ID and visibility status are required'
        });
      }

      const updatedRating = await prisma.rating.update({
        where: { id: ratingId },
        data: { isVisible },
        include: {
          task: { select: { title: true } }
        }
      });

      // Recalculate average ratings if visibility changed
      if (updatedRating.ratedWorkerId) {
        await ratingService.updateAverageRatings(updatedRating.ratedWorkerId, 'WORKER');
      }
      if (updatedRating.ratedEmployerId) {
        await ratingService.updateAverageRatings(updatedRating.ratedEmployerId, 'EMPLOYER');
      }

      res.json({
        success: true,
        data: { rating: updatedRating },
        message: `Rating ${isVisible ? 'shown' : 'hidden'} successfully`
      });

    } catch (error) {
      console.error('❌ Rating Controller error in updateRatingVisibility:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to update rating visibility'
      });
    }
  }
}

module.exports = new RatingController();