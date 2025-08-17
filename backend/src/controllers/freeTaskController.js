/**
 * Free Task Controller
 * Handles the free task system for new employers
 */

const { prisma } = require('../config/database');
const { awardCategoryBadge, processFreeTaskBadgeEarning } = require('../services/badgeService');

/**
 * Create Free Task (for new employers)
 * POST /api/free-tasks
 */
const createFreeTask = async (req, res) => {
  try {
    console.log('🆓 Creating free task for new employer');
    
    const {
      employerId,
      title,
      description,
      category,
      duration = 120, // Default 2 hours
      skillTags = [],
      difficulty = 'beginner'
    } = req.body;

    // Validation
    if (!employerId || !title || !description || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Employer ID, title, description, and category are required'
      });
    }

    // Check if employer exists and hasn't used all free tasks
    const employer = await prisma.employer.findUnique({
      where: { id: employerId }
    });

    if (!employer) {
      return res.status(404).json({
        success: false,
        error: 'Employer not found',
        message: 'Employer account not found'
      });
    }

    if (employer.freeTasksUsed >= 3) {
      return res.status(400).json({
        success: false,
        error: 'Free task limit exceeded',
        message: 'You have already used all 3 free tasks. Please upgrade to post more tasks.'
      });
    }

    // Create free task
    const freeTask = await prisma.$transaction(async (tx) => {
      // Create the task
      const task = await tx.bronzeTask.create({
        data: {
          employerId,
          title: title.trim(),
          description: description.trim(),
          category,
          duration: Math.min(Math.max(duration, 60), 240), // 1-4 hours max
          payAmount: 0, // Free tasks don't pay initially
          difficulty,
          skillTags: Array.isArray(skillTags) ? skillTags : [],
          isFreeTask: true,
          canEarnBadge: true,
          badgeCategory: category,
          maxApplications: 10, // Max 10 applications for free tasks
          minTasksCompleted: 0 // Anyone can apply
        }
      });

      // Update employer's free task count
      await tx.employer.update({
        where: { id: employerId },
        data: {
          freeTasksUsed: employer.freeTasksUsed + 1,
          hasUsedFreeTasks: true,
          tasksPosted: employer.tasksPosted + 1
        }
      });

      return task;
    });

    console.log('✅ Free task created:', {
      taskId: freeTask.id,
      employerId,
      category: freeTask.category,
      freeTasksUsed: employer.freeTasksUsed + 1
    });

    return res.status(201).json({
      success: true,
      message: 'Free task created successfully!',
      data: {
        task: {
          id: freeTask.id,
          title: freeTask.title,
          description: freeTask.description,
          category: freeTask.category,
          duration: freeTask.duration,
          difficulty: freeTask.difficulty,
          skillTags: freeTask.skillTags,
          isFreeTask: freeTask.isFreeTask,
          canEarnBadge: freeTask.canEarnBadge,
          maxApplications: freeTask.maxApplications,
          createdAt: freeTask.createdAt
        },
        employer: {
          freeTasksUsed: employer.freeTasksUsed + 1,
          remainingFreeTasks: 3 - (employer.freeTasksUsed + 1)
        },
        instructions: [
          'Workers can now apply to your free task',
          'You can review up to 10 applications',
          'Select the best submissions to award badges',
          'This helps workers earn their first category badges'
        ]
      }
    });

  } catch (error) {
    console.error('❌ Create free task error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create free task',
      message: 'Unable to create free task. Please try again.'
    });
  }
};

/**
 * Get Free Tasks (for workers to apply)
 * GET /api/free-tasks
 */
const getFreeTasks = async (req, res) => {
  try {
    const { 
      category,
      workerId,
      difficulty = 'beginner'
    } = req.query;

    console.log('🔍 Getting free tasks:', { category, workerId, difficulty });

    const where = {
      isFreeTask: true,
      isActive: true
    };

    if (category) {
      where.category = category;
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    // Get free tasks
    const freeTasks = await prisma.bronzeTask.findMany({
      where,
      include: {
        employer: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        },
        applications: {
          where: workerId ? { workerId } : undefined,
          select: {
            id: true,
            status: true,
            appliedAt: true
          }
        },
        _count: {
          select: {
            applications: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    // Filter out tasks where max applications reached
    const availableFreeTasks = freeTasks.filter(task => 
      task._count.applications < task.maxApplications
    );

    const formattedTasks = availableFreeTasks.map(task => {
      const hasApplied = workerId ? task.applications.length > 0 : false;
      
      return {
        id: task.id,
        title: task.title,
        description: task.description,
        category: task.category,
        duration: task.duration,
        difficulty: task.difficulty,
        skillTags: task.skillTags,
        canEarnBadge: task.canEarnBadge,
        badgeCategory: task.badgeCategory,
        maxApplications: task.maxApplications,
        currentApplications: task._count.applications,
        spotsRemaining: task.maxApplications - task._count.applications,
        employer: {
          name: task.employer.user.name,
          isVerified: task.employer.isVerified
        },
        hasApplied,
        userApplication: hasApplied ? task.applications[0] : null,
        createdAt: task.createdAt,
        badges: {
          canEarn: task.canEarnBadge,
          category: task.badgeCategory,
          description: `Complete this task to earn your first ${task.category} badge!`
        }
      };
    });

    return res.json({
      success: true,
      data: {
        freeTasks: formattedTasks,
        total: formattedTasks.length,
        categories: [...new Set(formattedTasks.map(t => t.category))],
        systemInfo: {
          purpose: 'Free tasks help new workers earn their first category badges',
          maxApplicationsPerTask: 10,
          badgeEarning: 'Selected submissions will earn bronze badges in their respective categories'
        }
      }
    });

  } catch (error) {
    console.error('❌ Get free tasks error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch free tasks',
      message: 'Unable to retrieve free tasks'
    });
  }
};

/**
 * Select Winners for Free Task (Employer)
 * POST /api/free-tasks/:taskId/select-winners
 */
const selectFreeTaskWinners = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { selectedApplicationIds } = req.body;

    console.log('🏆 Selecting free task winners:', { taskId, selectedApplicationIds });

    if (!Array.isArray(selectedApplicationIds) || selectedApplicationIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No applications selected',
        message: 'Please select at least one application as winner'
      });
    }

    // Verify this is a free task
    const task = await prisma.bronzeTask.findUnique({
      where: { id: taskId },
      include: {
        applications: {
          where: {
            id: { in: selectedApplicationIds }
          },
          include: {
            worker: {
              include: {
                user: true
              }
            }
          }
        }
      }
    });

    if (!task || !task.isFreeTask) {
      return res.status(404).json({
        success: false,
        error: 'Free task not found',
        message: 'Task not found or not a free task'
      });
    }

    if (task.applications.length !== selectedApplicationIds.length) {
      return res.status(400).json({
        success: false,
        error: 'Invalid applications',
        message: 'Some selected applications do not exist'
      });
    }

    // Process winners and award badges
    const results = await prisma.$transaction(async (tx) => {
      const winnerResults = [];

      for (const application of task.applications) {
        // Update application status to completed
        await tx.bronzeTaskApplication.update({
          where: { id: application.id },
          data: { status: 'COMPLETED' }
        });

        // Award badge to the worker
        try {
          const badgeResult = await awardCategoryBadge(
            application.workerId,
            task.category,
            task.id,
            'free_task_submission'
          );

          winnerResults.push({
            applicationId: application.id,
            workerId: application.workerId,
            workerName: application.worker.user.name,
            badgeAwarded: badgeResult.newBadge || false,
            badgeLevel: badgeResult.badge?.badgeLevel || null
          });

        } catch (badgeError) {
          console.error('Error awarding badge to worker:', application.workerId, badgeError);
          winnerResults.push({
            applicationId: application.id,
            workerId: application.workerId,
            workerName: application.worker.user.name,
            badgeAwarded: false,
            error: 'Failed to award badge'
          });
        }
      }

      // Mark task as completed
      await tx.bronzeTask.update({
        where: { id: taskId },
        data: { isActive: false }
      });

      return winnerResults;
    });

    console.log('✅ Free task winners selected and badges awarded');

    return res.json({
      success: true,
      message: 'Winners selected and badges awarded successfully!',
      data: {
        taskId,
        winnersCount: results.length,
        badgesAwarded: results.filter(r => r.badgeAwarded).length,
        results
      }
    });

  } catch (error) {
    console.error('❌ Select free task winners error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to select winners',
      message: 'Unable to process winner selection'
    });
  }
};

/**
 * Get Employer's Free Task Analytics
 * GET /api/free-tasks/employer/:employerId/analytics
 */
const getEmployerFreeTaskAnalytics = async (req, res) => {
  try {
    const { employerId } = req.params;

    const employer = await prisma.employer.findUnique({
      where: { id: employerId },
      include: {
        bronzeTasks: {
          where: { isFreeTask: true },
          include: {
            applications: {
              include: {
                worker: {
                  include: {
                    user: { select: { name: true } }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!employer) {
      return res.status(404).json({
        success: false,
        error: 'Employer not found',
        message: 'Employer account not found'
      });
    }

    const analytics = {
      freeTasksUsed: employer.freeTasksUsed,
      remainingFreeTasks: 3 - employer.freeTasksUsed,
      totalApplicationsReceived: employer.bronzeTasks.reduce(
        (sum, task) => sum + task.applications.length, 0
      ),
      tasksCompleted: employer.bronzeTasks.filter(
        task => !task.isActive
      ).length,
      badgesAwarded: employer.bronzeTasks.reduce(
        (sum, task) => sum + task.applications.filter(
          app => app.status === 'COMPLETED'
        ).length, 0
      ),
      tasks: employer.bronzeTasks.map(task => ({
        id: task.id,
        title: task.title,
        category: task.category,
        applications: task.applications.length,
        completed: !task.isActive,
        winners: task.applications.filter(app => app.status === 'COMPLETED').length,
        createdAt: task.createdAt
      }))
    };

    return res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('❌ Get employer free task analytics error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics',
      message: 'Unable to retrieve free task analytics'
    });
  }
};

module.exports = {
  createFreeTask,
  getFreeTasks,
  selectFreeTaskWinners,
  getEmployerFreeTaskAnalytics
};