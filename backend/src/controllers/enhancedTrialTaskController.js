/**
 * Enhanced Trial Task Controller - Production Ready
 * FIXED: Context binding issues for method calls
 * 
 * New Features:
 * - Real-time evaluation with detailed feedback
 * - Payment processing for trial tasks
 * - Advanced analytics and progress tracking
 * - Performance-based recommendations
 * - Error recovery and fallback mechanisms
 */

const enhancedTrialTaskService = require('../services/enhancedTrialTaskService');
const paymentController = require('./paymentController');
const { prisma, withTransaction } = require('../config/database');

class EnhancedTrialTaskController {
  
  constructor() {
    // Bind all methods to maintain context
    this.getTrialTasks = this.getTrialTasks.bind(this);
    this.submitTrialTask = this.submitTrialTask.bind(this);
    this.getTrialTaskFeedback = this.getTrialTaskFeedback.bind(this);
    this.getTrialTaskSubmissions = this.getTrialTaskSubmissions.bind(this);
    this.getTrialTaskAnalytics = this.getTrialTaskAnalytics.bind(this);
    this.createTrialTask = this.createTrialTask.bind(this);
  }
  
  /**
   * Get available trial tasks with enhanced data
   * GET /api/trial-tasks
   */
  async getTrialTasks(req, res) {
    try {
      console.log('🎯 Enhanced Controller: getTrialTasks called');
      const { category, includeAnalytics = true, workerId } = req.query;
      
      // Get trial tasks with enhanced data
      const result = await enhancedTrialTaskService.getTrialTasks();
      
      if (result.success) {
        let enhancedData = result.data;
        
        // Add worker-specific recommendations if workerId provided
        if (workerId) {
          try {
            const recommendations = await this.getWorkerRecommendations(workerId);
            enhancedData.recommendations = recommendations;
          } catch (error) {
            console.warn('⚠️ Failed to get worker recommendations:', error.message);
          }
        }
        
        // Add system analytics if requested
        if (includeAnalytics) {
          try {
            const analytics = await this.getSystemAnalytics();
            enhancedData.systemAnalytics = analytics;
          } catch (error) {
            console.warn('⚠️ Failed to get system analytics:', error.message);
          }
        }

        res.json({
          success: true,
          data: enhancedData,
          message: 'Trial tasks retrieved successfully with enhanced data',
          meta: {
            version: '2.0',
            retrievedAt: new Date().toISOString(),
            source: result.data.source
          }
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          message: result.message
        });
      }
    } catch (error) {
      console.error('❌ Enhanced Controller error in getTrialTasks:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve trial tasks',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Submit trial task with enhanced evaluation and payment
   * POST /api/trial-tasks/:taskId/submit
   */
  async submitTrialTask(req, res) {
    try {
      console.log('🎯 Enhanced Controller: submitTrialTask called');
      console.log('📝 Request params:', req.params);
      console.log('📝 Request body keys:', Object.keys(req.body));
      
      const { taskId } = req.params;
      const { workerId, workerData, submittedWork, timeSpent, performanceMetrics } = req.body;

      // FIXED: Use static validation function instead of this.validateSubmission
      const validationResult = validateTrialSubmission(taskId, submittedWork, timeSpent);
      if (!validationResult.valid) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Submission validation failed',
          details: validationResult.errors
        });
      }

      // Determine effective worker ID and worker data
      const effectiveWorkerData = this.determineWorkerData(workerId, workerData, req);
      console.log('🆔 Effective worker data:', {
        workerId: effectiveWorkerData.workerId,
        hasData: !!effectiveWorkerData.data,
        dataKeys: Object.keys(effectiveWorkerData.data || {})
      });

      // Enhanced submission processing
      const submissionResult = await enhancedTrialTaskService.submitTrialTask(
        effectiveWorkerData.workerId,
        taskId,
        submittedWork,
        timeSpent || 0
      );

      if (submissionResult.success) {
        const result = submissionResult.data;
        
        // Add enhanced response data
        const enhancedResponse = {
          ...result,
          // Add performance analytics
          performanceAnalytics: await this.calculatePerformanceAnalytics(result.evaluation),
          // Add learning recommendations
          learningPath: await this.generateLearningPath(result.evaluation, taskId),
          // Add next steps with context
          enhancedNextSteps: await this.getEnhancedNextSteps(
            effectiveWorkerData.workerId, 
            result.evaluation,
            taskId
          ),
          // Add submission metadata
          submissionMetadata: {
            submittedAt: new Date().toISOString(),
            processingTime: Date.now() - req.startTime,
            version: '2.0'
          }
        };

        // Log successful submission for analytics
        this.logSubmissionAnalytics(taskId, effectiveWorkerData.workerId, result.evaluation);

        res.json({
          success: true,
          data: enhancedResponse,
          message: 'Trial task submitted and evaluated successfully',
          meta: {
            taskId,
            passed: result.evaluation.passed,
            scores: {
              accuracy: result.evaluation.accuracyScore,
              speed: result.evaluation.speedScore,
              quality: result.evaluation.qualityScore
            }
          }
        });
      } else {
        res.status(400).json({
          success: false,
          error: submissionResult.error,
          message: submissionResult.message
        });
      }
    } catch (error) {
      console.error('❌ Enhanced Controller error in submitTrialTask:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to submit trial task: ' + error.message,
        taskId: req.params.taskId
      });
    }
  }

  /**
   * Get real-time feedback for ongoing trial task
   * GET /api/trial-tasks/:taskId/feedback
   */
  async getTrialTaskFeedback(req, res) {
    try {
      console.log('💬 Enhanced Controller: getTrialTaskFeedback called');
      const { taskId } = req.params;
      const { workerId, includeHints = false } = req.query;

      // Get trial task details
      const trialTask = await enhancedTrialTaskService.getTrialTaskById(taskId);
      if (!trialTask) {
        return res.status(404).json({
          success: false,
          error: 'Trial task not found'
        });
      }

      // Generate contextual feedback
      const feedback = await this.generateContextualFeedback(trialTask, workerId, includeHints);

      res.json({
        success: true,
        data: {
          taskId,
          feedback,
          hints: includeHints ? await this.getTaskHints(taskId) : null,
          tips: await this.getTaskTips(taskId),
          estimatedTime: trialTask.timeLimit,
          difficulty: trialTask.difficulty
        },
        message: 'Feedback retrieved successfully'
      });

    } catch (error) {
      console.error('❌ Enhanced Controller error in getTrialTaskFeedback:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to get trial task feedback'
      });
    }
  }

  /**
   * Get trial task submissions with analytics
   * GET /api/trial-tasks/submissions/:workerId
   */
  async getTrialTaskSubmissions(req, res) {
    try {
      console.log('📊 Enhanced Controller: getTrialTaskSubmissions called');
      const { workerId } = req.params;
      const { includeAnalytics = true, includeRecommendations = true } = req.query;

      if (!workerId) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Worker ID is required'
        });
      }

      // Check if worker exists
      const workerExists = await this.checkWorkerExists(workerId);
      if (!workerExists) {
        return res.status(404).json({
          success: false,
          error: 'Worker not found',
          message: 'No worker found with the provided ID'
        });
      }

      // Get submissions from database
      const submissions = await prisma.trialTaskSubmission.findMany({
        where: { workerId },
        include: {
          trialTask: {
            select: {
              title: true,
              category: true,
              payAmount: true,
              difficulty: true
            }
          }
        },
        orderBy: { submittedAt: 'desc' }
      });

      // Format submissions with enhanced data
      const formattedSubmissions = submissions.map(sub => ({
        id: sub.id,
        taskId: sub.trialTaskId,
        taskTitle: sub.trialTask.title,
        category: sub.trialTask.category,
        payAmount: parseFloat(sub.trialTask.payAmount),
        difficulty: sub.trialTask.difficulty,
        timeSpent: sub.timeSpent,
        passed: sub.passed,
        scores: {
          accuracy: sub.accuracyScore,
          speed: sub.speedScore,
          quality: sub.qualityScore
        },
        feedback: sub.feedback,
        submittedAt: sub.submittedAt,
        // Add enhanced metrics
        performanceTier: this.getPerformanceTier(sub.accuracyScore, sub.speedScore, sub.qualityScore),
        earnings: sub.passed ? parseFloat(sub.trialTask.payAmount) : 0
      }));

      let responseData = {
        submissions: formattedSubmissions,
        summary: {
          totalSubmissions: submissions.length,
          passedSubmissions: submissions.filter(s => s.passed).length,
          totalEarnings: formattedSubmissions.reduce((sum, s) => sum + s.earnings, 0)
        }
      };

      // Add analytics if requested
      if (includeAnalytics) {
        responseData.analytics = await this.calculateSubmissionAnalytics(formattedSubmissions);
      }

      // Add recommendations if requested
      if (includeRecommendations) {
        responseData.recommendations = await this.generateWorkerRecommendations(
          workerId, 
          formattedSubmissions
        );
      }

      res.json({
        success: true,
        data: responseData,
        message: 'Trial submissions retrieved successfully'
      });

    } catch (error) {
      console.error('❌ Enhanced Controller error in getTrialTaskSubmissions:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to retrieve trial submissions'
      });
    }
  }

  /**
   * Get trial task analytics (Admin only)
   * GET /api/trial-tasks/analytics
   */
  async getTrialTaskAnalytics(req, res) {
    try {
      console.log('📈 Enhanced Controller: getTrialTaskAnalytics called');
      
      // Calculate comprehensive analytics
      const analytics = await this.calculateSystemAnalytics();

      res.json({
        success: true,
        data: analytics,
        message: 'Trial task analytics retrieved successfully'
      });

    } catch (error) {
      console.error('❌ Enhanced Controller error in getTrialTaskAnalytics:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to get trial task analytics'
      });
    }
  }

  /**
   * Create trial task (Admin only)
   * POST /api/trial-tasks
   */
  async createTrialTask(req, res) {
    try {
      console.log('🎯 Enhanced Controller: createTrialTask called');
      
      const taskData = req.body;
      
      // Validate task data
      const validation = this.validateTrialTaskData(taskData);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          message: 'Invalid trial task data',
          details: validation.errors
        });
      }

      // Create trial task in database
      const trialTask = await prisma.trialTask.create({
        data: {
          ...taskData,
          payAmount: parseFloat(taskData.payAmount),
          accuracyThreshold: parseFloat(taskData.accuracyThreshold),
          speedThreshold: taskData.speedThreshold ? parseFloat(taskData.speedThreshold) : null,
          isActive: true
        }
      });

      res.status(201).json({
        success: true,
        data: { trialTask },
        message: 'Trial task created successfully'
      });

    } catch (error) {
      console.error('❌ Enhanced Controller error in createTrialTask:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to create trial task'
      });
    }
  }

  /**
   * Helper Methods
   */

  determineWorkerData(workerId, workerData, req) {
    // Get session info
    const sessionWorkerId = req.workerId; // From auth middleware if available
    
    let effectiveWorkerId;
    let effectiveWorkerData = {};

    if (sessionWorkerId) {
      // Authenticated user
      effectiveWorkerId = sessionWorkerId;
      effectiveWorkerData = workerData || {};
    } else if (workerId && typeof workerId === 'string') {
      // Provided worker ID
      effectiveWorkerId = workerId;
      effectiveWorkerData = workerData || {};
    } else if (workerId && typeof workerId === 'object') {
      // Worker data passed as workerId parameter
      effectiveWorkerData = workerId;
      effectiveWorkerId = workerId.phone ? `trial_${workerId.phone}` : `temp_${Date.now()}`;
    } else if (workerData && workerData.phone) {
      // Worker data with phone
      effectiveWorkerData = workerData;
      effectiveWorkerId = `trial_${workerData.phone}`;
    } else {
      // Generate temporary ID
      effectiveWorkerId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      effectiveWorkerData = {};
    }

    return {
      workerId: effectiveWorkerId,
      data: effectiveWorkerData
    };
  }

  async calculatePerformanceAnalytics(evaluation) {
    const avgScore = (
      (evaluation.accuracyScore || 0) + 
      (evaluation.speedScore || 0) + 
      (evaluation.qualityScore || 0)
    ) / 3;

    return {
      overallScore: Math.round(avgScore),
      performanceLevel: this.getPerformanceLevel(avgScore),
      strengths: this.identifyStrengths(evaluation),
      improvements: this.identifyImprovements(evaluation),
      benchmarkComparison: await this.getBenchmarkComparison(evaluation)
    };
  }

  async generateLearningPath(evaluation, taskId) {
    const taskCategory = taskId.includes('data_entry') ? 'DATA_ENTRY' :
                        taskId.includes('content') ? 'CONTENT' :
                        taskId.includes('organization') ? 'ORGANIZATION' : 'GENERAL';

    const suggestions = [];

    if ((evaluation.accuracyScore || 0) < 80) {
      suggestions.push({
        skill: 'Accuracy',
        resources: this.getAccuracyResources(taskCategory),
        priority: 'high'
      });
    }

    if ((evaluation.speedScore || 0) < 70) {
      suggestions.push({
        skill: 'Speed',
        resources: this.getSpeedResources(taskCategory),
        priority: 'medium'
      });
    }

    return {
      currentLevel: this.getSkillLevel(evaluation),
      nextMilestone: this.getNextMilestone(evaluation),
      suggestions,
      estimatedImprovementTime: this.estimateImprovementTime(evaluation)
    };
  }

  async getEnhancedNextSteps(workerId, evaluation, taskId) {
    const isRegistered = workerId && !workerId.startsWith('trial_') && !workerId.startsWith('temp_');
    
    if (!isRegistered) {
      // Trial registration flow
      return {
        nextAction: 'continue_trials',
        message: evaluation.passed 
          ? 'Excellent work! Continue with the next trial task.' 
          : 'Task completed. Focus on improving accuracy in the next task.',
        actionButton: 'Continue to Next Task',
        progress: {
          current: 1,
          total: 3,
          percentage: 33
        }
      };
    }

    // Registered worker flow
    try {
      const worker = await prisma.worker.findUnique({
        where: { id: workerId },
        select: {
          trialTasksCompleted: true,
          trialTasksPassed: true,
          bronzeBadgeEarned: true
        }
      });

      if (!worker) {
        return {
          nextAction: 'continue_trials',
          message: 'Continue with trial tasks'
        };
      }

      if (worker.trialTasksCompleted < 3) {
        return {
          nextAction: 'continue_trials',
          message: `Complete ${3 - worker.trialTasksCompleted} more trial tasks to qualify for Bronze badge`,
          actionButton: 'Continue Trial Tasks',
          progress: {
            current: worker.trialTasksCompleted,
            total: 3,
            percentage: Math.round((worker.trialTasksCompleted / 3) * 100)
          }
        };
      }

      if (worker.trialTasksPassed >= 2 && !worker.bronzeBadgeEarned) {
        return {
          nextAction: 'earn_bronze_badge',
          message: 'Congratulations! You\'ve qualified for the Bronze badge',
          actionButton: 'Claim Bronze Badge',
          achievement: true
        };
      }

      return {
        nextAction: 'browse_tasks',
        message: 'Start browsing Bronze level tasks and earning money!',
        actionButton: 'Browse Available Tasks'
      };

    } catch (error) {
      console.error('Error getting enhanced next steps:', error);
      return {
        nextAction: 'continue',
        message: 'Continue your journey on NanoJobs'
      };
    }
  }

  logSubmissionAnalytics(taskId, workerId, evaluation) {
    // Log for future analytics (could be sent to analytics service)
    console.log('📊 Submission Analytics:', {
      taskId,
      workerId: workerId.startsWith('trial_') ? 'trial_user' : 'registered_user',
      passed: evaluation.passed,
      scores: {
        accuracy: evaluation.accuracyScore,
        speed: evaluation.speedScore,
        quality: evaluation.qualityScore
      },
      timestamp: new Date().toISOString()
    });
  }

  async generateContextualFeedback(trialTask, workerId, includeHints) {
    const basefeedback = {
      taskTitle: trialTask.title,
      category: trialTask.category,
      timeLimit: trialTask.timeLimit,
      payAmount: trialTask.payAmount,
      difficulty: trialTask.difficulty
    };

    // Add worker-specific feedback if workerId provided
    if (workerId && !workerId.startsWith('trial_') && !workerId.startsWith('temp_')) {
      try {
        const workerHistory = await prisma.trialTaskSubmission.findMany({
          where: { 
            workerId,
            trialTask: { category: trialTask.category }
          },
          orderBy: { submittedAt: 'desc' },
          take: 3
        });

        if (workerHistory.length > 0) {
          const avgAccuracy = workerHistory.reduce((sum, h) => sum + (h.accuracyScore || 0), 0) / workerHistory.length;
          basefeedback.personalizedTips = this.getPersonalizedTips(avgAccuracy, trialTask.category);
        }
      } catch (error) {
        console.warn('Failed to get worker history for feedback:', error);
      }
    }

    return basefeedback;
  }

  async getTaskHints(taskId) {
    const hintMap = {
      'trial_data_entry_1': [
        'Start with the easier entries to build confidence',
        'Use Tab key to move between fields quickly',
        'Double-check phone numbers - they should be exactly 10 digits'
      ],
      'trial_content_1': [
        'Start with a strong opening sentence for each product',
        'Make sure to mention all the features listed',
        'Write like you\'re convincing a friend to buy the product'
      ],
      'trial_organization_1': [
        'Look for patterns in how the contact info is formatted',
        'Clean up extra spaces and inconsistent capitalization',
        'Make sure each contact has all four fields filled'
      ]
    };

    return hintMap[taskId] || [
      'Read the instructions carefully before starting',
      'Take your time to ensure accuracy',
      'Ask yourself: "Would I be satisfied with this quality?"'
    ];
  }

  async getTaskTips(taskId) {
    const tipMap = {
      'trial_data_entry_1': {
        beforeStarting: [
          'Read through all the sample data first',
          'Note the formatting requirements for each field',
          'Plan to double-check your work'
        ],
        duringTask: [
          'Focus on accuracy over speed',
          'Use consistent formatting throughout',
          'Take short breaks if your eyes get tired'
        ],
        beforeSubmitting: [
          'Review each entry for completeness',
          'Check phone numbers have exactly 10 digits',
          'Verify email addresses look correct'
        ]
      }
    };

    return tipMap[taskId] || {
      beforeStarting: ['Read instructions carefully', 'Understand the requirements'],
      duringTask: ['Focus on quality', 'Manage your time'],
      beforeSubmitting: ['Review your work', 'Check for errors']
    };
  }

  async checkWorkerExists(workerId) {
    if (workerId.startsWith('trial_') || workerId.startsWith('temp_')) {
      return true; // Trial workers always "exist"
    }

    try {
      const worker = await prisma.worker.findUnique({
        where: { id: workerId },
        select: { id: true }
      });
      return !!worker;
    } catch (error) {
      console.error('Error checking worker existence:', error);
      return false;
    }
  }

  getPerformanceTier(accuracy, speed, quality) {
    const avgScore = (accuracy + speed + quality) / 3;
    
    if (avgScore >= 90) return 'excellent';
    if (avgScore >= 80) return 'good';
    if (avgScore >= 70) return 'satisfactory';
    if (avgScore >= 60) return 'needs_improvement';
    return 'poor';
  }

  async calculateSubmissionAnalytics(submissions) {
    if (submissions.length === 0) {
      return {
        totalSubmissions: 0,
        averageScore: 0,
        improvementTrend: 'no_data'
      };
    }

    const totalSubmissions = submissions.length;
    const passedSubmissions = submissions.filter(s => s.passed).length;
    const totalEarnings = submissions.reduce((sum, s) => sum + s.earnings, 0);

    // Calculate averages
    const avgAccuracy = submissions.reduce((sum, s) => sum + s.scores.accuracy, 0) / totalSubmissions;
    const avgSpeed = submissions.reduce((sum, s) => sum + s.scores.speed, 0) / totalSubmissions;
    const avgQuality = submissions.reduce((sum, s) => sum + s.scores.quality, 0) / totalSubmissions;

    // Calculate improvement trend
    const recentSubmissions = submissions.slice(0, 3);
    const olderSubmissions = submissions.slice(3, 6);
    
    let improvementTrend = 'stable';
    if (recentSubmissions.length > 0 && olderSubmissions.length > 0) {
      const recentAvg = recentSubmissions.reduce((sum, s) => 
        sum + (s.scores.accuracy + s.scores.speed + s.scores.quality) / 3, 0
      ) / recentSubmissions.length;
      
      const olderAvg = olderSubmissions.reduce((sum, s) => 
        sum + (s.scores.accuracy + s.scores.speed + s.scores.quality) / 3, 0
      ) / olderSubmissions.length;

      if (recentAvg > olderAvg + 5) improvementTrend = 'improving';
      else if (recentAvg < olderAvg - 5) improvementTrend = 'declining';
    }

    return {
      totalSubmissions,
      passedSubmissions,
      passRate: (passedSubmissions / totalSubmissions) * 100,
      totalEarnings,
      averageScores: {
        accuracy: Math.round(avgAccuracy),
        speed: Math.round(avgSpeed),
        quality: Math.round(avgQuality),
        overall: Math.round((avgAccuracy + avgSpeed + avgQuality) / 3)
      },
      improvementTrend,
      strongestSkill: this.getStrongestSkill(avgAccuracy, avgSpeed, avgQuality),
      weakestSkill: this.getWeakestSkill(avgAccuracy, avgSpeed, avgQuality)
    };
  }

  async generateWorkerRecommendations(workerId, submissions) {
    const recommendations = [];

    if (submissions.length === 0) {
      return [
        {
          type: 'getting_started',
          title: 'Complete Your First Trial Task',
          description: 'Start with the Data Entry trial to get familiar with the platform',
          priority: 'high'
        }
      ];
    }

    const passRate = submissions.filter(s => s.passed).length / submissions.length;
    const avgScore = submissions.reduce((sum, s) => 
      sum + (s.scores.accuracy + s.scores.speed + s.scores.quality) / 3, 0
    ) / submissions.length;

    if (passRate < 0.7) {
      recommendations.push({
        type: 'improvement',
        title: 'Focus on Task Requirements',
        description: 'Take more time to understand task instructions before starting',
        priority: 'high'
      });
    }

    if (avgScore < 75) {
      recommendations.push({
        type: 'skill_building',
        title: 'Practice Basic Skills',
        description: 'Consider practicing typing, reading comprehension, or organizational skills',
        priority: 'medium'
      });
    }

    if (submissions.length >= 3 && passRate >= 0.7) {
      recommendations.push({
        type: 'progression',
        title: 'Ready for Real Tasks',
        description: 'You\'re performing well! Start browsing paid tasks in the marketplace',
        priority: 'high'
      });
    }

    return recommendations;
  }

  async calculateSystemAnalytics() {
    try {
      const [taskStats, submissionStats, performanceStats] = await Promise.all([
        this.getTaskStats(),
        this.getSubmissionStats(),
        this.getPerformanceStats()
      ]);

      return {
        tasks: taskStats,
        submissions: submissionStats,
        performance: performanceStats,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error calculating system analytics:', error);
      return {
        error: 'Unable to calculate analytics',
        generatedAt: new Date().toISOString()
      };
    }
  }

  async getTaskStats() {
    const totalTasks = await prisma.trialTask.count();
    const activeTasks = await prisma.trialTask.count({ where: { isActive: true } });
    
    const tasksByCategory = await prisma.trialTask.groupBy({
      by: ['category'],
      _count: { id: true },
      _sum: { payAmount: true }
    });

    return {
      total: totalTasks,
      active: activeTasks,
      byCategory: tasksByCategory,
      totalEarningsAvailable: tasksByCategory.reduce((sum, cat) => 
        sum + (parseFloat(cat._sum.payAmount) || 0), 0
      )
    };
  }

  async getSubmissionStats() {
    const totalSubmissions = await prisma.trialTaskSubmission.count();
    const passedSubmissions = await prisma.trialTaskSubmission.count({ 
      where: { passed: true } 
    });

    return {
      total: totalSubmissions,
      passed: passedSubmissions,
      passRate: totalSubmissions > 0 ? (passedSubmissions / totalSubmissions) * 100 : 0
    };
  }

  async getPerformanceStats() {
    const submissions = await prisma.trialTaskSubmission.findMany({
      select: {
        accuracyScore: true,
        speedScore: true,
        qualityScore: true,
        passed: true
      }
    });

    if (submissions.length === 0) {
      return {
        averageScores: { accuracy: 0, speed: 0, quality: 0 },
        passRate: 0
      };
    }

    const avgAccuracy = submissions.reduce((sum, s) => sum + (s.accuracyScore || 0), 0) / submissions.length;
    const avgSpeed = submissions.reduce((sum, s) => sum + (s.speedScore || 0), 0) / submissions.length;
    const avgQuality = submissions.reduce((sum, s) => sum + (s.qualityScore || 0), 0) / submissions.length;

    return {
      averageScores: {
        accuracy: Math.round(avgAccuracy),
        speed: Math.round(avgSpeed),
        quality: Math.round(avgQuality)
      },
      passRate: (submissions.filter(s => s.passed).length / submissions.length) * 100
    };
  }

  // Additional helper methods
  getPerformanceLevel(score) {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'good';
    if (score >= 70) return 'satisfactory';
    return 'needs_improvement';
  }

  identifyStrengths(evaluation) {
    const strengths = [];
    if (evaluation.accuracyScore >= 85) strengths.push('High accuracy');
    if (evaluation.speedScore >= 80) strengths.push('Good speed');
    if (evaluation.qualityScore >= 85) strengths.push('Quality work');
    return strengths;
  }

  identifyImprovements(evaluation) {
    const improvements = [];
    if (evaluation.accuracyScore < 75) improvements.push('Focus on accuracy');
    if (evaluation.speedScore < 60) improvements.push('Improve speed');
    if (evaluation.qualityScore < 70) improvements.push('Enhance quality');
    return improvements;
  }

  getStrongestSkill(accuracy, speed, quality) {
    const scores = { accuracy, speed, quality };
    return Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
  }

  getWeakestSkill(accuracy, speed, quality) {
    const scores = { accuracy, speed, quality };
    return Object.keys(scores).reduce((a, b) => scores[a] < scores[b] ? a : b);
  }

  validateTrialTaskData(data) {
    const errors = [];
    
    if (!data.title) errors.push('Title is required');
    if (!data.description) errors.push('Description is required');
    if (!data.category) errors.push('Category is required');
    if (!data.payAmount || data.payAmount <= 0) errors.push('Valid pay amount is required');
    if (!data.timeLimit || data.timeLimit <= 0) errors.push('Valid time limit is required');
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Placeholder methods that can be implemented later
  async getWorkerRecommendations(workerId) {
    return [];
  }

  async getSystemAnalytics() {
    return await this.calculateSystemAnalytics();
  }

  async getBenchmarkComparison(evaluation) {
    return null;
  }

  getAccuracyResources(taskCategory) {
    return ['Practice basic skills', 'Read instructions carefully'];
  }

  getSpeedResources(taskCategory) {
    return ['Practice typing', 'Use keyboard shortcuts'];
  }

  getSkillLevel(evaluation) {
    return 'beginner';
  }

  getNextMilestone(evaluation) {
    return 'Complete more tasks';
  }

  estimateImprovementTime(evaluation) {
    return '1-2 weeks with practice';
  }

  getPersonalizedTips(avgAccuracy, category) {
    return ['Keep practicing', 'Focus on quality'];
  }
}

/**
 * FIXED: Standalone validation function to avoid context issues
 */
function validateTrialSubmission(taskId, submittedWork, timeSpent) {
  const errors = [];
  
  if (!taskId) errors.push('Task ID is required');
  if (!submittedWork || typeof submittedWork !== 'object') {
    errors.push('Submitted work data is required');
  }
  if (typeof timeSpent !== 'number' || timeSpent < 0) {
    errors.push('Valid time spent is required');
  }

  // Task-specific validation
  if (taskId.includes('data_entry')) {
    const hasEntries = Object.keys(submittedWork).some(key => 
      key.startsWith('entry_') && submittedWork[key]
    );
    if (!hasEntries) {
      errors.push('At least one data entry is required');
    }
  }

  if (taskId.includes('content')) {
    if (!submittedWork.content || submittedWork.content.trim().length < 50) {
      errors.push('Content must be at least 50 characters long');
    }
  }

  if (taskId.includes('organization')) {
    const hasOrgData = Object.keys(submittedWork).some(key => 
      key.startsWith('org_') && submittedWork[key]
    );
    if (!hasOrgData) {
      errors.push('Organization data is required');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = new EnhancedTrialTaskController();