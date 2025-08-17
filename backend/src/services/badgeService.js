/**
 * Badge Service
 * Handles category-specific badge earning and management
 */

const { prisma } = require('../config/database');

/**
 * Award badge to worker for a specific category
 */
const awardCategoryBadge = async (workerId, category, taskId = null, earnedBy = 'regular_task', submissionQuality = null) => {
  try {
    console.log(`🏆 Awarding badge for worker ${workerId} in category ${category}`);
    
    // Check if worker already has a badge in this category
    const existingBadge = await prisma.categoryBadge.findUnique({
      where: {
        workerId_category: {
          workerId,
          category
        }
      }
    });

    if (existingBadge) {
      console.log(`✅ Worker already has ${existingBadge.badgeLevel} badge in ${category}`);
      
      // Update existing badge stats
      const updatedBadge = await prisma.categoryBadge.update({
        where: { id: existingBadge.id },
        data: {
          tasksCompleted: existingBadge.tasksCompleted + 1,
          // Badge upgrade logic can be added here
        }
      });
      
      return { alreadyHasBadge: true, badge: updatedBadge };
    }

    // Create new bronze badge
    const newBadge = await prisma.categoryBadge.create({
      data: {
        workerId,
        category,
        badgeLevel: 'BRONZE',
        earnedBy,
        taskId,
        submissionQuality,
        tasksCompleted: 1
      }
    });

    console.log(`🎉 New BRONZE badge awarded in ${category}!`);
    
    return { newBadge: true, badge: newBadge };

  } catch (error) {
    console.error('❌ Error awarding badge:', error);
    throw error;
  }
};

/**
 * Update badge stats after task completion
 */
const updateBadgeStats = async (workerId, category, taskPayAmount, rating = null) => {
  try {
    const badge = await prisma.categoryBadge.findUnique({
      where: {
        workerId_category: {
          workerId,
          category
        }
      }
    });

    if (!badge) {
      console.log(`No badge found for worker ${workerId} in ${category}`);
      return null;
    }

    // Calculate new averages
    const currentTasks = badge.tasksCompleted;
    const newTaskCount = currentTasks + 1;
    
    let newAverageRating = badge.averageRating;
    if (rating && newAverageRating) {
      newAverageRating = ((badge.averageRating * currentTasks) + rating) / newTaskCount;
    } else if (rating) {
      newAverageRating = rating;
    }

    const newTotalEarnings = parseFloat(badge.totalEarnings) + parseFloat(taskPayAmount);

    // Check for badge level upgrade
    const newBadgeLevel = calculateBadgeLevel(newTaskCount, newAverageRating);

    const updatedBadge = await prisma.categoryBadge.update({
      where: { id: badge.id },
      data: {
        tasksCompleted: newTaskCount,
        averageRating: newAverageRating,
        totalEarnings: newTotalEarnings,
        badgeLevel: newBadgeLevel
      }
    });

    if (newBadgeLevel !== badge.badgeLevel) {
      console.log(`🎊 Badge upgraded from ${badge.badgeLevel} to ${newBadgeLevel} in ${category}!`);
    }

    return updatedBadge;

  } catch (error) {
    console.error('❌ Error updating badge stats:', error);
    throw error;
  }
};

/**
 * Calculate badge level based on performance
 */
const calculateBadgeLevel = (tasksCompleted, averageRating) => {
  if (!averageRating) return 'BRONZE';
  
  if (tasksCompleted >= 30 && averageRating >= 4.8) {
    return 'PLATINUM';
  } else if (tasksCompleted >= 15 && averageRating >= 4.7) {
    return 'GOLD';
  } else if (tasksCompleted >= 5 && averageRating >= 4.5) {
    return 'SILVER';
  } else {
    return 'BRONZE';
  }
};

/**
 * Get worker's badges summary
 */
const getWorkerBadgesSummary = async (workerId) => {
  try {
    const badges = await prisma.categoryBadge.findMany({
      where: { workerId },
      orderBy: { earnedAt: 'desc' }
    });

    const summary = {
      totalBadges: badges.length,
      bronze: badges.filter(b => b.badgeLevel === 'BRONZE').length,
      silver: badges.filter(b => b.badgeLevel === 'SILVER').length,
      gold: badges.filter(b => b.badgeLevel === 'GOLD').length,
      platinum: badges.filter(b => b.badgeLevel === 'PLATINUM').length,
      totalTasksCompleted: badges.reduce((sum, b) => sum + b.tasksCompleted, 0),
      totalEarnings: badges.reduce((sum, b) => sum + parseFloat(b.totalEarnings), 0),
      averageRating: badges.length > 0 ? 
        badges.reduce((sum, b) => sum + (b.averageRating || 0), 0) / badges.length : 0,
      badges: badges.map(badge => ({
        id: badge.id,
        category: badge.category,
        badgeLevel: badge.badgeLevel,
        earnedAt: badge.earnedAt,
        earnedBy: badge.earnedBy,
        tasksCompleted: badge.tasksCompleted,
        averageRating: badge.averageRating,
        totalEarnings: badge.totalEarnings
      }))
    };

    return summary;

  } catch (error) {
    console.error('❌ Error getting badge summary:', error);
    throw error;
  }
};

/**
 * Check if worker can apply to tasks in a category
 */
const canApplyToCategory = async (workerId, category, taskDifficulty = 'beginner') => {
  try {
    const badge = await prisma.categoryBadge.findUnique({
      where: {
        workerId_category: {
          workerId,
          category
        }
      }
    });

    // If no badge, can only apply to beginner tasks or free tasks
    if (!badge) {
      return {
        canApply: taskDifficulty === 'beginner',
        reason: taskDifficulty === 'beginner' ? 
          'Can apply to beginner tasks without badge' : 
          'Need to earn badge in this category first'
      };
    }

    // With badge, can apply based on badge level and task difficulty
    const difficultyRequirements = {
      'beginner': ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'],
      'intermediate': ['SILVER', 'GOLD', 'PLATINUM'],
      'advanced': ['GOLD', 'PLATINUM'],
      'expert': ['PLATINUM']
    };

    const allowedBadges = difficultyRequirements[taskDifficulty] || ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
    const canApply = allowedBadges.includes(badge.badgeLevel);

    return {
      canApply,
      badgeLevel: badge.badgeLevel,
      reason: canApply ? 
        `Has ${badge.badgeLevel} badge in ${category}` : 
        `Need ${allowedBadges[0]} or higher badge for ${taskDifficulty} tasks`
    };

  } catch (error) {
    console.error('❌ Error checking category eligibility:', error);
    throw error;
  }
};

/**
 * Get leaderboard for a category
 */
const getCategoryLeaderboard = async (category, limit = 10) => {
  try {
    const topWorkers = await prisma.categoryBadge.findMany({
      where: { category },
      orderBy: [
        { badgeLevel: 'desc' },
        { averageRating: 'desc' },
        { tasksCompleted: 'desc' }
      ],
      take: limit,
      include: {
        worker: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });

    return topWorkers.map((badge, index) => ({
      rank: index + 1,
      workerId: badge.workerId,
      workerName: badge.worker.user.name,
      badgeLevel: badge.badgeLevel,
      tasksCompleted: badge.tasksCompleted,
      averageRating: badge.averageRating,
      totalEarnings: badge.totalEarnings,
      earnedAt: badge.earnedAt
    }));

  } catch (error) {
    console.error('❌ Error getting category leaderboard:', error);
    throw error;
  }
};

/**
 * Process badge earning after free task completion
 */
const processFreeTaskBadgeEarning = async (applicationId) => {
  try {
    // Get application details
    const application = await prisma.bronzeTaskApplication.findUnique({
      where: { id: applicationId },
      include: {
        bronzeTask: true,
        worker: true,
        submission: true
      }
    });

    if (!application || !application.bronzeTask.isFreeTask) {
      console.log('Not a free task or application not found');
      return null;
    }

    // Award badge for the task category
    const badgeResult = await awardCategoryBadge(
      application.workerId,
      application.bronzeTask.category,
      application.bronzeTask.id,
      'free_task_submission',
      application.submission?.qualityScore || null
    );

    // Update worker's overall stats
    await prisma.worker.update({
      where: { id: application.workerId },
      data: {
        tasksCompleted: {
          increment: 1
        }
      }
    });

    return badgeResult;

  } catch (error) {
    console.error('❌ Error processing free task badge:', error);
    throw error;
  }
};

module.exports = {
  awardCategoryBadge,
  updateBadgeStats,
  calculateBadgeLevel,
  getWorkerBadgesSummary,
  canApplyToCategory,
  getCategoryLeaderboard,
  processFreeTaskBadgeEarning
};