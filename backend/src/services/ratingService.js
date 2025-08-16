/**
 * Rating Service - Mutual Star-Based Rating System
 * Handles worker-employer rating functionality after task completion
 * 
 * Features:
 * - 1-5 star ratings only (no text)
 * - Mutual rating system
 * - Rating visibility before task acceptance  
 * - Average rating calculation
 * - One rating per task completion
 */

const { prisma } = require('../config/database');

class RatingService {
  
  /**
   * Submit a rating after task completion
   * @param {string} applicationId - Task application ID
   * @param {string} raterUserId - ID of user giving the rating
   * @param {number} stars - Rating (1-5 stars)
   */
  async submitRating(applicationId, raterUserId, stars) {
    try {
      console.log('🌟 Submitting rating:', { applicationId, raterUserId, stars });

      // Validate stars
      if (!stars || stars < 1 || stars > 5 || !Number.isInteger(stars)) {
        throw new Error('Rating must be between 1 and 5 stars');
      }

      // Get task application with task and participants
      const application = await prisma.taskApplication.findUnique({
        where: { id: applicationId },
        include: {
          task: {
            include: {
              employer: {
                include: { user: true }
              }
            }
          },
          worker: {
            include: { user: true }
          }
        }
      });

      if (!application) {
        throw new Error('Task application not found');
      }

      if (application.status !== 'COMPLETED') {
        throw new Error('Can only rate completed tasks');
      }

      // Determine rater and rated party
      const isWorkerRating = application.worker.user.id === raterUserId;
      const isEmployerRating = application.task.employer.user.id === raterUserId;

      if (!isWorkerRating && !isEmployerRating) {
        throw new Error('Only task participants can submit ratings');
      }

      // Check if rating already exists
      const existingRating = await prisma.rating.findFirst({
        where: {
          applicationId,
          raterType: isWorkerRating ? 'WORKER' : 'EMPLOYER'
        }
      });

      if (existingRating) {
        throw new Error('Rating already submitted for this task');
      }

      // Create rating
      const ratingData = {
        taskId: application.taskId,
        applicationId,
        raterType: isWorkerRating ? 'WORKER' : 'EMPLOYER',
        stars,
        isVisible: true
      };

      if (isWorkerRating) {
        // Worker rating employer
        ratingData.workerId = application.workerId;
        ratingData.ratedEmployerId = application.task.employerId;
      } else {
        // Employer rating worker  
        ratingData.employerId = application.task.employerId;
        ratingData.ratedWorkerId = application.workerId;
      }

      const rating = await prisma.rating.create({
        data: ratingData
      });

      // Update average ratings
      await this.updateAverageRatings(
        isWorkerRating ? application.task.employerId : application.workerId,
        isWorkerRating ? 'EMPLOYER' : 'WORKER'
      );

      console.log('✅ Rating submitted successfully:', rating.id);
      return {
        success: true,
        data: {
          rating,
          message: 'Rating submitted successfully'
        }
      };

    } catch (error) {
      console.error('❌ Rating submission error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to submit rating'
      };
    }
  }

  /**
   * Get ratings for a worker or employer
   * @param {string} userId - User ID (worker or employer)
   * @param {string} userType - 'WORKER' or 'EMPLOYER'
   */
  async getRatings(userId, userType) {
    try {
      console.log('📊 Getting ratings for:', { userId, userType });

      let ratings;
      let averageRating;
      let totalRatings;

      if (userType === 'WORKER') {
        const worker = await prisma.worker.findFirst({
          where: { userId },
          include: {
            ratingsReceived: {
              include: {
                task: { select: { title: true, category: true } },
                employerRater: {
                  include: {
                    user: { select: { name: true } }
                  }
                }
              },
              orderBy: { ratedAt: 'desc' }
            }
          }
        });

        if (!worker) {
          throw new Error('Worker not found');
        }

        ratings = worker.ratingsReceived;
        averageRating = worker.averageRating;

      } else if (userType === 'EMPLOYER') {
        const employer = await prisma.employer.findFirst({
          where: { userId },
          include: {
            ratingsReceived: {
              include: {
                task: { select: { title: true, category: true } },
                workerRater: {
                  include: {
                    user: { select: { name: true } }
                  }
                }
              },
              orderBy: { ratedAt: 'desc' }
            }
          }
        });

        if (!employer) {
          throw new Error('Employer not found');
        }

        ratings = employer.ratingsReceived;
        averageRating = employer.averageRating;

      } else {
        throw new Error('Invalid user type');
      }

      totalRatings = ratings.length;

      // Format ratings for frontend
      const formattedRatings = ratings.map(rating => ({
        id: rating.id,
        stars: rating.stars,
        taskTitle: rating.task.title,
        taskCategory: rating.task.category,
        raterName: userType === 'WORKER' ? 
          rating.employerRater?.user.name : 
          rating.workerRater?.user.name,
        ratedAt: rating.ratedAt
      }));

      return {
        success: true,
        data: {
          ratings: formattedRatings,
          averageRating: averageRating ? parseFloat(averageRating) : null,
          totalRatings,
          ratingDistribution: this.calculateRatingDistribution(ratings)
        }
      };

    } catch (error) {
      console.error('❌ Get ratings error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get ratings'
      };
    }
  }

  /**
   * Get rating overview for task acceptance decision
   * @param {string} userId - User ID to get ratings for
   * @param {string} userType - 'WORKER' or 'EMPLOYER'
   */
  async getRatingOverview(userId, userType) {
    try {
      const result = await this.getRatings(userId, userType);
      
      if (!result.success) {
        return result;
      }

      const { averageRating, totalRatings, ratingDistribution } = result.data;

      return {
        success: true,
        data: {
          averageRating: averageRating || 0,
          totalRatings,
          ratingDistribution,
          displayRating: totalRatings > 0 ? averageRating : null,
          isNewUser: totalRatings === 0
        }
      };

    } catch (error) {
      console.error('❌ Get rating overview error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get rating overview'
      };
    }
  }

  /**
   * Check if user can rate a specific task application
   * @param {string} applicationId - Task application ID  
   * @param {string} raterUserId - User ID attempting to rate
   */
  async canUserRate(applicationId, raterUserId) {
    try {
      const application = await prisma.taskApplication.findUnique({
        where: { id: applicationId },
        include: {
          task: {
            include: {
              employer: { include: { user: true } }
            }
          },
          worker: { include: { user: true } }
        }
      });

      if (!application) {
        return { canRate: false, reason: 'Task application not found' };
      }

      if (application.status !== 'COMPLETED') {
        return { canRate: false, reason: 'Task not completed yet' };
      }

      const isParticipant = 
        application.worker.user.id === raterUserId || 
        application.task.employer.user.id === raterUserId;

      if (!isParticipant) {
        return { canRate: false, reason: 'Not a participant in this task' };
      }

      // Check if already rated
      const isWorkerRating = application.worker.user.id === raterUserId;
      const existingRating = await prisma.rating.findFirst({
        where: {
          applicationId,
          raterType: isWorkerRating ? 'WORKER' : 'EMPLOYER'
        }
      });

      if (existingRating) {
        return { canRate: false, reason: 'Already rated this task' };
      }

      return { 
        canRate: true, 
        raterType: isWorkerRating ? 'WORKER' : 'EMPLOYER',
        taskTitle: application.task.title
      };

    } catch (error) {
      console.error('❌ Can user rate error:', error);
      return { canRate: false, reason: 'Error checking rating eligibility' };
    }
  }

  /**
   * Get pending ratings for a user (tasks they can rate)
   * @param {string} userId - User ID
   */
  async getPendingRatings(userId) {
    try {
      console.log('⏳ Getting pending ratings for:', userId);

      // Get user type
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          worker: true,
          employer: true
        }
      });

      if (!user) {
        throw new Error('User not found');
      }

      let completedApplications = [];

      if (user.worker) {
        // Worker - get tasks they completed where they can rate the employer
        completedApplications = await prisma.taskApplication.findMany({
          where: {
            workerId: user.worker.id,
            status: 'COMPLETED'
          },
          include: {
            task: {
              include: {
                employer: {
                  include: { user: { select: { name: true } } }
                }
              }
            },
            rating: {
              where: { raterType: 'WORKER' }
            }
          }
        });
      } else if (user.employer) {
        // Employer - get tasks they posted that are completed where they can rate workers
        const completedTasks = await prisma.bronzeTask.findMany({
          where: { 
            employerId: user.employer.id
          },
          include: {
            taskApplications: {
              where: { status: 'COMPLETED' },
              include: {
                worker: {
                  include: { user: { select: { name: true } } }
                },
                rating: {
                  where: { raterType: 'EMPLOYER' }
                }
              }
            }
          }
        });

        completedApplications = completedTasks.flatMap(task => task.taskApplications);
      }

      // Filter out already rated applications
      const pendingRatings = completedApplications
        .filter(app => app.rating.length === 0)
        .map(app => ({
          applicationId: app.id,
          taskId: app.taskId,
          taskTitle: app.task.title,
          taskCategory: app.task.category,
          completedAt: app.completedAt,
          otherPartyName: user.worker ? 
            app.task.employer.user.name : 
            app.worker.user.name,
          canRate: true
        }));

      return {
        success: true,
        data: {
          pendingRatings,
          totalPending: pendingRatings.length
        }
      };

    } catch (error) {
      console.error('❌ Get pending ratings error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get pending ratings'
      };
    }
  }

  /**
   * Update average ratings for a worker or employer
   * @param {string} entityId - Worker ID or Employer ID
   * @param {string} entityType - 'WORKER' or 'EMPLOYER'  
   */
  async updateAverageRatings(entityId, entityType) {
    try {
      console.log('📊 Updating average ratings:', { entityId, entityType });

      let ratings;
      if (entityType === 'WORKER') {
        ratings = await prisma.rating.findMany({
          where: { 
            ratedWorkerId: entityId,
            isVisible: true 
          }
        });
      } else {
        ratings = await prisma.rating.findMany({
          where: { 
            ratedEmployerId: entityId,
            isVisible: true 
          }
        });
      }

      if (ratings.length === 0) {
        console.log('No ratings found to calculate average');
        return;
      }

      const averageRating = ratings.reduce((sum, rating) => sum + rating.stars, 0) / ratings.length;
      const roundedAverage = Math.round(averageRating * 10) / 10; // Round to 1 decimal

      // Update the entity with new average
      if (entityType === 'WORKER') {
        await prisma.worker.update({
          where: { id: entityId },
          data: { averageRating: roundedAverage }
        });
      } else {
        await prisma.employer.update({
          where: { id: entityId },
          data: { averageRating: roundedAverage }
        });
      }

      console.log('✅ Average rating updated:', roundedAverage);
      
    } catch (error) {
      console.error('❌ Update average ratings error:', error);
    }
  }

  /**
   * Calculate rating distribution (how many 1-star, 2-star, etc.)
   * @param {Array} ratings - Array of rating objects
   */
  calculateRatingDistribution(ratings) {
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    
    ratings.forEach(rating => {
      if (rating.stars >= 1 && rating.stars <= 5) {
        distribution[rating.stars]++;
      }
    });

    return distribution;
  }

  /**
   * Get rating statistics for admin dashboard
   */
  async getRatingStatistics() {
    try {
      const [
        totalRatings,
        averageRatingAcrossPlatform,
        ratingsByStars,
        recentRatings
      ] = await Promise.all([
        prisma.rating.count({ where: { isVisible: true } }),
        
        prisma.rating.aggregate({
          where: { isVisible: true },
          _avg: { stars: true }
        }),
        
        prisma.rating.groupBy({
          by: ['stars'],
          where: { isVisible: true },
          _count: { stars: true }
        }),
        
        prisma.rating.findMany({
          where: { isVisible: true },
          take: 10,
          orderBy: { ratedAt: 'desc' },
          include: {
            task: { select: { title: true } },
            workerRater: {
              include: { user: { select: { name: true } } }
            },
            employerRater: {
              include: { user: { select: { name: true } } }
            }
          }
        })
      ]);

      return {
        success: true,
        data: {
          totalRatings,
          platformAverageRating: averageRatingAcrossPlatform._avg.stars || 0,
          ratingDistribution: ratingsByStars.reduce((acc, item) => {
            acc[item.stars] = item._count.stars;
            return acc;
          }, {}),
          recentRatings: recentRatings.map(rating => ({
            stars: rating.stars,
            taskTitle: rating.task.title,
            raterName: rating.workerRater?.user.name || rating.employerRater?.user.name,
            raterType: rating.raterType,
            ratedAt: rating.ratedAt
          }))
        }
      };

    } catch (error) {
      console.error('❌ Get rating statistics error:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to get rating statistics'
      };
    }
  }
}

module.exports = new RatingService();