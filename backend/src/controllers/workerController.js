const { v4: uuidv4 } = require('uuid');
const aiService = require('../services/aiService');
const quizService = require('../services/enhancedTrialTaskService');
const resumeParser = require('../services/resumeParser');
const { cleanupFile } = require('../middleware/upload');
const { prisma, withTransaction } = require('../config/database');
const trialTaskService = require('../services/enhancedTrialTaskService');

/**
 * Worker Controller with Database Integration
 * Handles both resume-based and quiz-based worker registration
 */

class WorkerController {
  
  /**
   * Register new worker with resume upload
   * POST /api/workers/register-with-resume
   */
  async registerWithResume(req, res) {
    try {
      const { name, phone, email } = req.body;
      
      // Validate required fields
      if (!name || !phone) {
        if (req.fileInfo) {
          cleanupFile(req.fileInfo.filePath);
        }
        
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'Name and phone number are required'
        });
      }
      
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: phone },
            ...(email ? [{ email: email }] : [])
          ]
        }
      });
      
      if (existingUser) {
        if (req.fileInfo) {
          cleanupFile(req.fileInfo.filePath);
        }
        
        return res.status(409).json({
          success: false,
          error: 'User already exists',
          message: 'A user with this phone number or email already exists'
        });
      }
      
      // Parse the uploaded resume
      console.log('Parsing resume:', req.fileInfo.originalName);
      const parseResult = await resumeParser.parseResume(
        req.fileInfo.filePath,
        req.fileInfo.originalName
      );
      
      if (!parseResult.success) {
        cleanupFile(req.fileInfo.filePath);
        
        return res.status(400).json({
          success: false,
          error: 'Resume parsing failed',
          message: parseResult.error
        });
      }
      
      // Analyze resume with AI and assign badge
      console.log('Analyzing resume with AI for:', name);
      const aiAnalysis = await aiService.analyzeResumeAndAssignBadge(
        parseResult.text,
        name
      );
      
      // Create user and worker in database transaction
      const result = await withTransaction(async (prisma) => {
        // Create user
        const user = await prisma.user.create({
          data: {
            name: name.trim(),
            phone: phone.trim(),
            email: email ? email.trim().toLowerCase() : null,
            userType: 'WORKER'
          }
        });

        // Create worker profile
        const worker = await prisma.worker.create({
          data: {
            userId: user.id,
            badge: aiAnalysis.badge,
            badgeReason: aiAnalysis.badgeReason,
            skills: aiAnalysis.skills || [],
            experienceLevel: aiAnalysis.experienceLevel || 'FRESHER',
            estimatedHourlyRate: aiAnalysis.estimatedHourlyRate || 120,
            registrationMethod: 'RESUME',
            preferredCategories: aiAnalysis.recommendedTasks || []
          }
        });

        // Store resume data
        const resume = await prisma.resume.create({
          data: {
            workerId: worker.id,
            originalName: req.fileInfo.originalName,
            fileName: req.fileInfo.fileName,
            filePath: req.fileInfo.filePath,
            fileSize: req.fileInfo.fileSize,
            mimeType: req.fileInfo.mimeType,
            textContent: parseResult.text,
            metadata: parseResult.metadata,
            basicInfo: parseResult.basicInfo
          }
        });

        // Create badge history entry
        await prisma.badgeHistory.create({
          data: {
            workerId: worker.id,
            toBadge: aiAnalysis.badge,
            reason: aiAnalysis.badgeReason,
            source: 'resume_analysis'
          }
        });

        // Create session
        const session = await prisma.session.create({
          data: {
            userId: user.id,
            token: uuidv4(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
          }
        });

        return { user, worker, resume, session };
      });
      
      // Get badge display info
      const badgeDisplayInfo = aiService.getBadgeDisplayInfo(aiAnalysis.badge);
      
      console.log(`Worker registered successfully: ${name} (${aiAnalysis.badge} badge)`);
      
      // Return success response
      res.status(201).json({
        success: true,
        message: 'Worker registered successfully',
        data: {
          worker: {
            id: result.worker.id,
            name: result.user.name,
            phone: result.user.phone,
            email: result.user.email,
            badge: result.worker.badge,
            badgeReason: result.worker.badgeReason,
            skills: result.worker.skills,
            experienceLevel: result.worker.experienceLevel,
            estimatedHourlyRate: result.worker.estimatedHourlyRate,
            recommendedTasks: result.worker.preferredCategories,
            createdAt: result.user.createdAt
          },
          badgeInfo: badgeDisplayInfo,
          sessionToken: result.session.token,
          aiAnalysis: {
            confidence: aiAnalysis.confidence,
            source: aiAnalysis.source,
            analyzedAt: aiAnalysis.analyzedAt
          }
        }
      });
      
    } catch (error) {
      console.error('Worker registration error:', error);
      
      // Cleanup uploaded file
      if (req.fileInfo) {
        cleanupFile(req.fileInfo.filePath);
      }
      
      res.status(500).json({
        success: false,
        error: 'Registration failed',
        message: 'An error occurred during registration. Please try again.'
      });
    }
  }

  

  /**
   * Register new worker with quiz assessment
   * POST /api/workers/register-with-quiz
   */
  async registerWithQuiz(req, res) {
    try {
      const { name, phone, email, answers, timeTaken } = req.body;
      
      // Validate required fields
      if (!name || !phone || !answers) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'Name, phone number, and quiz answers are required'
        });
      }

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { phone: phone },
            ...(email ? [{ email: email }] : [])
          ]
        }
      });
      
      if (existingUser) {
        return res.status(409).json({
          success: false,
          error: 'User already exists',
          message: 'A user with this phone number or email already exists'
        });
      }

      // Validate quiz answers
      const validation = quizService.validateAnswers(answers);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: 'Invalid quiz answers',
          message: 'Please complete all required questions',
          details: validation.errors
        });
      }

      // Evaluate quiz with AI
      console.log('Evaluating quiz answers for:', name);
      const evaluation = await quizService.evaluateWithAI(answers, name);
      
      // Create user and worker in database transaction
      const result = await withTransaction(async (prisma) => {
        // Create user
        const user = await prisma.user.create({
          data: {
            name: name.trim(),
            phone: phone.trim(),
            email: email ? email.trim().toLowerCase() : null,
            userType: 'WORKER'
          }
        });

        // Create worker profile
        const worker = await prisma.worker.create({
          data: {
            userId: user.id,
            badge: evaluation.badge,
            badgeReason: evaluation.badgeReason,
            skills: evaluation.strengths || [],
            experienceLevel: evaluation.experienceLevel || 'FRESHER',
            estimatedHourlyRate: evaluation.estimatedHourlyRate || 120,
            registrationMethod: 'QUIZ',
            preferredCategories: evaluation.recommendedTasks || []
          }
        });

        // Store quiz results
        const quizResult = await prisma.quizResult.create({
          data: {
            workerId: worker.id,
            answers: answers,
            totalScore: evaluation.totalScore,
            maxScore: evaluation.maxPossibleScore,
            timeTaken: timeTaken || null,
            evaluatedBy: 'ai',
            aiConfidence: evaluation.aiConfidence,
            aiSource: evaluation.aiSource
          }
        });

        // Create badge history entry
        await prisma.badgeHistory.create({
          data: {
            workerId: worker.id,
            toBadge: evaluation.badge,
            reason: evaluation.badgeReason,
            source: 'quiz_evaluation'
          }
        });

        // Create session
        const session = await prisma.session.create({
          data: {
            userId: user.id,
            token: uuidv4(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
          }
        });

        return { user, worker, quizResult, session };
      });

      // Get badge display info
      const badgeDisplayInfo = aiService.getBadgeDisplayInfo(evaluation.badge);
      
      console.log(`Worker registered via quiz: ${name} (${evaluation.badge} badge)`);
      
      // Return success response
      res.status(201).json({
        success: true,
        message: 'Worker registered successfully via skill assessment',
        data: {
          worker: {
            id: result.worker.id,
            name: result.user.name,
            phone: result.user.phone,  
            email: result.user.email,
            badge: result.worker.badge,
            badgeReason: result.worker.badgeReason,
            skills: result.worker.skills,
            experienceLevel: result.worker.experienceLevel,
            estimatedHourlyRate: result.worker.estimatedHourlyRate,
            recommendedTasks: result.worker.preferredCategories,
            createdAt: result.user.createdAt
          },
          badgeInfo: badgeDisplayInfo,
          sessionToken: result.session.token,
          quizEvaluation: {
            totalScore: evaluation.totalScore,
            maxScore: evaluation.maxPossibleScore,
            percentage: evaluation.percentage,
            confidence: evaluation.aiConfidence,
            source: evaluation.aiSource,
            evaluatedAt: evaluation.evaluatedAt
          }
        }
      });

    } catch (error) {
      console.error('Quiz registration error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Registration failed',
        message: 'An error occurred during quiz registration. Please try again.'
      });
    }
  }
  
 /**
   * Get worker profile by ID - ENHANCED WITH DEBUG LOGGING
   * GET /api/workers/:id
   */
 async getWorkerProfile(req, res) {
  try {
    const { id } = req.params;
    
    console.log('🔍 DEBUG - getWorkerProfile called with ID:', id);
    console.log('🔍 DEBUG - ID type:', typeof id);
    console.log('🔍 DEBUG - ID length:', id.length);
    
    // Validate ID format (cuid should be 25 characters)
    if (!id || typeof id !== 'string') {
      console.log('❌ DEBUG - Invalid ID format');
      return res.status(400).json({
        success: false,
        error: 'Invalid worker ID',
        message: 'Worker ID is required and must be a string'
      });
    }

    console.log('🔍 DEBUG - Querying database for worker...');
    
    const worker = await prisma.worker.findUnique({
      where: { id },
      include: {
        user: true,
        resume: true,
        quizResult: true,
        badgeHistory: {
          orderBy: { assignedAt: 'desc' },
          take: 5
        },
        // Include rating information
        ratingsReceived: {
          include: {
            task: { select: { title: true, category: true } },
            employerRater: {
              include: { user: { select: { name: true } } }
            }
          },
          orderBy: { ratedAt: 'desc' },
          take: 10
        }
      }
    });
    
    console.log('🔍 DEBUG - Database query result:', worker ? 'Found worker' : 'Worker not found');
    
    if (!worker) {
      console.log('❌ DEBUG - Worker not found in database');
      return res.status(404).json({
        success: false,
        error: 'Worker not found',
        message: 'No worker found with the provided ID'
      });
    }
    
    console.log('🔍 DEBUG - Worker data:', {
      id: worker.id,
      userId: worker.userId,
      name: worker.user?.name,
      badge: worker.badge,
      registrationMethod: worker.registrationMethod
    });
    
    // Update last access time
    try {
      await prisma.session.updateMany({
        where: { 
          userId: worker.userId,
          isActive: true 
        },
        data: { lastUsed: new Date() }
      });
      console.log('🔍 DEBUG - Updated session last used time');
    } catch (sessionError) {
      console.warn('⚠️  DEBUG - Failed to update session:', sessionError.message);
      // Don't fail the request if session update fails
    }
    
    // Get badge display info
    const badgeDisplayInfo = aiService.getBadgeDisplayInfo(worker.badge);
    
    const responseData = {
      success: true,
      data: {
        worker: {
          id: worker.id,
          name: worker.user?.name,
          phone: worker.user?.phone,
          email: worker.user?.email,
          badge: worker.badge,
          badgeReason: worker.badgeReason,
          skills: worker.skills || [],
          experienceLevel: worker.experienceLevel,
          estimatedHourlyRate: worker.estimatedHourlyRate,
          recommendedTasks: worker.preferredCategories || [],
          registrationMethod: worker.registrationMethod,
          stats: {
            tasksCompleted: worker.tasksCompleted || 0,
            totalEarnings: parseFloat(worker.totalEarnings || '0'),
            averageRating: worker.averageRating ? parseFloat(worker.averageRating) : 0
          },
          // Rating information
          rating: {
            averageRating: worker.averageRating ? parseFloat(worker.averageRating) : null,
            totalRatings: worker.ratingsReceived?.length || 0,
            ratingDistribution: worker.ratingsReceived ? 
              worker.ratingsReceived.reduce((acc, rating) => {
                if (rating.stars >= 1 && rating.stars <= 5) {
                  acc[rating.stars] = (acc[rating.stars] || 0) + 1;
                }
                return acc;
              }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }) : { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            recentRatings: worker.ratingsReceived?.slice(0, 5).map(rating => ({
              stars: rating.stars,
              taskTitle: rating.task.title,
              taskCategory: rating.task.category,
              employerName: rating.employerRater?.user.name,
              ratedAt: rating.ratedAt
            })) || [],
            isNewUser: !worker.ratingsReceived || worker.ratingsReceived.length === 0
          },
          profile: {
            isKYCCompleted: worker.isKYCCompleted || false,
            isPhoneVerified: worker.isPhoneVerified || false,
            isEmailVerified: worker.isEmailVerified || false,
            availability: worker.availability || 'available',
            workingHours: {
              start: worker.workingHoursStart || '09:00',
              end: worker.workingHoursEnd || '18:00',
              timezone: worker.timezone || 'Asia/Kolkata'
            }
          },
          createdAt: worker.createdAt
        },
        badgeInfo: badgeDisplayInfo
      }
    };
    
    console.log('✅ DEBUG - Sending successful response');
    res.json(responseData);
    
  } catch (error) {
    console.error('❌ Get worker profile error:', error);
    console.error('❌ Error stack:', error.stack);
    
    // Check if it's a Prisma error
    if (error.code) {
      console.error('❌ Prisma error code:', error.code);
      console.error('❌ Prisma error message:', error.message);
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile',
      message: 'An error occurred while fetching the worker profile',
      debug: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// ADD THESE METHODS TO YOUR EXISTING workerController.js

/**
 * Register new worker with trial tasks (Simple Form Path)
 * POST /api/workers/register-with-trial-tasks
 */
// In workerController.js, replace the registerWithTrialTasks method:

/**
 * Register new worker with trial tasks (Simple Form Path)
 * POST /api/workers/register-with-trial-tasks
 */
async registerWithTrialTasks(req, res) {
  try {
    const { 
      name, 
      phone, 
      email, 
      educationLevel, 
      availableHours, 
      previousWork,
      trialTaskResults 
    } = req.body;
    
    console.log('🔄 Registering worker via trial tasks:', { name, phone, email, educationLevel, availableHours });
    console.log('📊 Trial task results received:', trialTaskResults);
    
    // Validate required fields
    if (!name || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Name and phone number are required'
      });
    }

    if (!trialTaskResults || trialTaskResults.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Trial tasks required',
        message: 'Please complete trial tasks before registering'
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: phone },
          ...(email ? [{ email: email }] : [])
        ]
      }
    });
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists',
        message: 'A user with this phone number or email already exists'
      });
    }

    // FIXED: Call evaluateTrialTaskResults as a standalone function
    const trialEvaluation = evaluateTrialTaskResults(trialTaskResults);
    
    // Create user and worker in database transaction
    const result = await withTransaction(async (prisma) => {
      // Create user
      const user = await prisma.user.create({
        data: {
          name: name.trim(),
          phone: phone.trim(),
          email: email ? email.trim().toLowerCase() : null,
          userType: 'WORKER'
        }
      });

      // Create worker profile with simple form data
      const worker = await prisma.worker.create({
        data: {
          userId: user.id,
          badge: trialEvaluation.badge,
          badgeReason: trialEvaluation.badgeReason,
          skills: trialEvaluation.skills || [],
          experienceLevel: trialEvaluation.experienceLevel || 'FRESHER',
          estimatedHourlyRate: trialEvaluation.estimatedHourlyRate || 120,
          registrationMethod: 'QUIZ', // Keep existing enum, but it's really trial tasks
          preferredCategories: trialEvaluation.recommendedTasks || [],
          
          // Simple form specific fields
          registrationPath: 'simple_form',
          hasResume: false,
          educationLevel: educationLevel || null,
          availableHours: parseInt(availableHours) || 3,
          previousWork: previousWork || null,
          
          // Trial task stats
          trialTasksCompleted: trialTaskResults.length,
          trialTasksPassed: trialTaskResults.filter(r => r.evaluation && r.evaluation.passed).length,
          bronzeBadgeEarned: trialEvaluation.badge !== 'PENDING'
        }
      });

      // Store trial task results if trial tasks exist in database
      try {
        for (const trialResult of trialTaskResults) {
          // Only create submission if we have a valid trial task ID in database
          const trialTaskExists = await prisma.trialTask.findUnique({
            where: { id: trialResult.taskId }
          });
          
          if (trialTaskExists && trialResult.evaluation) {
            await prisma.trialTaskSubmission.create({
              data: {
                trialTaskId: trialResult.taskId,
                workerId: worker.id,
                submittedWork: trialResult.submittedWork || {},
                timeSpent: trialResult.timeSpent || 0,
                passed: trialResult.evaluation.passed,
                accuracyScore: trialResult.evaluation.accuracyScore || 0,
                speedScore: trialResult.evaluation.speedScore || 0,
                qualityScore: trialResult.evaluation.qualityScore || 0,
                feedback: trialResult.evaluation.feedback || '',
                autoEvaluated: true
              }
            });
          }
        }
      } catch (submissionError) {
        console.warn('⚠️ Failed to save trial submissions (continuing registration):', submissionError.message);
        // Don't fail registration if trial submissions fail
      }

      // Create badge history entry
      await prisma.badgeHistory.create({
        data: {
          workerId: worker.id,
          toBadge: trialEvaluation.badge,
          reason: trialEvaluation.badgeReason,
          source: 'trial_tasks_evaluation'
        }
      });

      // Create session
      const session = await prisma.session.create({
        data: {
          userId: user.id,
          token: uuidv4(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      });

      return { user, worker, session };
    });
    
    // Get badge display info
    const badgeDisplayInfo = aiService.getBadgeDisplayInfo(trialEvaluation.badge);
    
    console.log(`✅ Worker registered via trial tasks: ${name} (${trialEvaluation.badge} badge)`);
    
    // Return success response
    res.status(201).json({
      success: true,
      message: 'Worker registered successfully via trial tasks',
      data: {
        worker: {
          id: result.worker.id,
          name: result.user.name,
          phone: result.user.phone,
          email: result.user.email,
          badge: result.worker.badge,
          badgeReason: result.worker.badgeReason,
          skills: result.worker.skills,
          experienceLevel: result.worker.experienceLevel,
          estimatedHourlyRate: result.worker.estimatedHourlyRate,
          recommendedTasks: result.worker.preferredCategories,
          registrationPath: 'simple_form',
          trialTaskStats: {
            completed: result.worker.trialTasksCompleted,
            passed: result.worker.trialTasksPassed
          },
          createdAt: result.user.createdAt
        },
        badgeInfo: badgeDisplayInfo,
        sessionToken: result.session.token,
        trialEvaluation: {
          totalTasks: trialTaskResults.length,
          passed: trialTaskResults.filter(r => r.evaluation && r.evaluation.passed).length,
          evaluatedAt: new Date().toISOString()
        }
      }
    });

  } catch (error) {
    console.error('❌ Trial task registration error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
    
    res.status(500).json({
      success: false,
      error: 'Registration failed',
      message: 'An error occurred during trial task registration. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// FIXED: Move evaluateTrialTaskResults outside the class as a standalone function
// Remove it from inside the class and place it AFTER the class definition

/**
 * Get available trial tasks
 * GET /api/workers/trial-tasks
 */
async getTrialTasks(req, res) {
  try {
    const trialTaskService = require('../services/trialTaskService');
    const result = await trialTaskService.getTrialTasks();
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Get trial tasks error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch trial tasks',
      message: error.message
    });
  }
}

/**
 * Submit trial task work
 * POST /api/workers/trial-tasks/:taskId/submit
 */
async submitTrialTask(req, res) {
  try {
    const { taskId } = req.params;
    const { workerId, submittedWork, timeSpent } = req.body;

    if (!workerId || !submittedWork) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Worker ID and submitted work are required'
      });
    }

    const trialTaskService = require('../services/trialTaskService');
    const result = await trialTaskService.submitTrialTask(workerId, taskId, submittedWork, timeSpent);
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Submit trial task error:', error);
    res.status(500).json({
      success: false,
      error: 'Submission failed',
      message: error.message
    });
  }
}
  
  /**
   * Update worker profile
   * PUT /api/workers/:id
   */
  async updateWorkerProfile(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const worker = await prisma.worker.findUnique({
        where: { id },
        include: { user: true }
      });
      
      if (!worker) {
        return res.status(404).json({
          success: false,
          error: 'Worker not found'
        });
      }
      
      // Prepare update data
      const workerUpdates = {};
      const userUpdates = {};
      
      if (updates.name !== undefined) {
        userUpdates.name = updates.name;
      }
      
      if (updates.email !== undefined) {
        userUpdates.email = updates.email;
      }
      
      if (updates.skills !== undefined) {
        workerUpdates.skills = Array.isArray(updates.skills) ? updates.skills : [];
      }
      
      if (updates.availability !== undefined) {
        workerUpdates.availability = updates.availability;
      }
      
      if (updates.preferredTaskCategories !== undefined) {
        workerUpdates.preferredCategories = Array.isArray(updates.preferredTaskCategories) ? updates.preferredTaskCategories : [];
      }
      
      // Update in transaction
      const result = await withTransaction(async (prisma) => {
        const updatedWorker = await prisma.worker.update({
          where: { id },
          data: workerUpdates,
          include: { user: true }
        });
        
        if (Object.keys(userUpdates).length > 0) {
          await prisma.user.update({
            where: { id: worker.userId },
            data: userUpdates
          });
        }
        
        return updatedWorker;
      });
      
      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: {
          worker: {
            id: result.id,
            name: result.user.name,
            email: result.user.email,
            skills: result.skills,
            availability: result.availability,
            preferredCategories: result.preferredCategories,
            updatedAt: result.updatedAt
          }
        }
      });
      
    } catch (error) {
      console.error('Update worker profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Update failed',
        message: 'An error occurred while updating the profile'
      });
    }
  }
  
  /**
   * Get all workers (admin endpoint)
   * GET /api/workers
   */
  async getAllWorkers(req, res) {
    try {
      const { page = 1, limit = 10, badge, status } = req.query;
      
      const where = {};
      
      if (badge) {
        where.badge = badge.toUpperCase();
      }
      
      if (status) {
        where.user = { isActive: status === 'active' };
      }
      
      const [workers, total] = await Promise.all([
        prisma.worker.findMany({
          where,
          include: {
            user: {
              select: {
                name: true,
                phone: true,
                email: true,
                isActive: true,
                createdAt: true
              }
            }
          },
          skip: (parseInt(page) - 1) * parseInt(limit),
          take: parseInt(limit),
          orderBy: { createdAt: 'desc' }
        }),
        prisma.worker.count({ where })
      ]);
      
      res.json({
        success: true,
        data: {
          workers: workers.map(worker => ({
            id: worker.id,
            name: worker.user.name,
            badge: worker.badge,
            experienceLevel: worker.experienceLevel,
            tasksCompleted: worker.tasksCompleted,
            totalEarnings: parseFloat(worker.totalEarnings),
            registrationMethod: worker.registrationMethod,
            createdAt: worker.createdAt,
            status: worker.user.isActive ? 'active' : 'inactive'
          })),
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalWorkers: total,
            hasNext: parseInt(page) * parseInt(limit) < total,
            hasPrev: parseInt(page) > 1
          }
        }
      });
      
    } catch (error) {
      console.error('Get all workers error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch workers'
      });
    }
  }
  
  /**
   * Verify session token
   * GET /api/workers/verify-session
   */
  async verifySession(req, res) {
    try {
      const { token } = req.query;
      
      if (!token) {
        return res.status(400).json({
          success: false,
          error: 'Session token required'
        });
      }
      
      const session = await prisma.session.findUnique({
        where: { token },
        include: {
          user: {
            include: {
              worker: true
            }
          }
        }
      });
      
      if (!session || !session.isActive || session.expiresAt < new Date()) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or expired session'
        });
      }
      
      // Update last used timestamp
      await prisma.session.update({
        where: { token },
        data: { lastUsed: new Date() }
      });
      
      res.json({
        success: true,
        data: {
          workerId: session.user.worker?.id,
          sessionValid: true,
          lastUsed: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error('Session verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Session verification failed'
      });
    }
  }

  /**
   * Get skill assessment questions
   * GET /api/workers/quiz-questions
   */
  async getQuizQuestions(req, res) {
    try {
      const { category } = req.query;
      const result = await quizService.generateQuestions(category);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error('Get quiz questions error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate quiz questions'
      });
    }
  }
}

// Add this function AFTER the WorkerController class definition (before module.exports)
// in workerController.js

/**
 * Evaluate trial task results and assign badge (STANDALONE FUNCTION)
 * @param {Array} trialTaskResults - Results from completed trial tasks
 * @returns {Object} Badge assignment and evaluation
 */
function evaluateTrialTaskResults(trialTaskResults) {
  console.log('🔍 Evaluating trial task results:', trialTaskResults);
  
  const totalTasks = trialTaskResults.length;
  const passedTasks = trialTaskResults.filter(result => result.evaluation && result.evaluation.passed).length;
  const passRate = totalTasks > 0 ? (passedTasks / totalTasks) * 100 : 0;

  // Calculate average scores
  const validResults = trialTaskResults.filter(r => r.evaluation);
  const avgAccuracy = validResults.length > 0 
    ? validResults.reduce((sum, r) => sum + (r.evaluation.accuracyScore || 0), 0) / validResults.length
    : 0;
  const avgSpeed = validResults.length > 0
    ? validResults.reduce((sum, r) => sum + (r.evaluation.speedScore || 0), 0) / validResults.length
    : 0;
  const avgQuality = validResults.length > 0
    ? validResults.reduce((sum, r) => sum + (r.evaluation.qualityScore || 0), 0) / validResults.length
    : 0;

  // Determine badge and skills based on performance
  let badge = 'BRONZE'; // Default for simple form path
  let badgeReason = '';
  let experienceLevel = 'FRESHER';
  let estimatedHourlyRate = 120;
  let skills = ['Basic Skills'];
  let recommendedTasks = ['data-entry'];

  // Badge assignment logic
  if (passedTasks >= 2 && avgAccuracy >= 85) {
    badge = 'BRONZE';
    badgeReason = `Earned Bronze badge by passing ${passedTasks}/${totalTasks} trial tasks with ${Math.round(avgAccuracy)}% average accuracy`;
    estimatedHourlyRate = 150;
    
    // Determine skills based on task performance
    trialTaskResults.forEach(result => {
      if (result.evaluation && result.evaluation.passed) {
        const taskId = result.taskId || '';
        if (taskId.includes('data_entry')) {
          skills.push('Data Entry', 'Typing', 'Attention to Detail');
          recommendedTasks.push('data-entry', 'virtual-assistant');
        } else if (taskId.includes('content')) {
          skills.push('Content Writing', 'English Communication');
          recommendedTasks.push('content-writing');
        } else if (taskId.includes('organization')) {
          skills.push('Organization', 'Excel Skills', 'Data Management');
          recommendedTasks.push('data-entry', 'virtual-assistant');
        }
      }
    });

    // Remove duplicates
    skills = [...new Set(skills)];
    recommendedTasks = [...new Set(recommendedTasks)];

  } else if (passedTasks >= 1) {
    badge = 'BRONZE';
    badgeReason = `Earned Bronze badge with ${passedTasks}/${totalTasks} trials passed. Continue practicing to improve your skills.`;
    estimatedHourlyRate = 120;
  } else {
    badge = 'BRONZE'; // Still give Bronze for completing trials
    badgeReason = `Bronze badge assigned for completing trial tasks. Focus on accuracy and speed in your first tasks.`;
    estimatedHourlyRate = 100;
    experienceLevel = 'FRESHER';
  }

  console.log('✅ Trial evaluation completed:', {
    badge,
    passedTasks,
    totalTasks,
    avgAccuracy: Math.round(avgAccuracy),
    estimatedHourlyRate
  });

  return {
    badge,
    badgeReason,
    experienceLevel,
    estimatedHourlyRate,
    skills,
    recommendedTasks,
    trialStats: {
      totalTasks,
      passedTasks,
      passRate: Math.round(passRate),
      avgAccuracy: Math.round(avgAccuracy),
      avgSpeed: Math.round(avgSpeed),
      avgQuality: Math.round(avgQuality)
    }
  };
}

// Also remove the original evaluateTrialTaskResults method from INSIDE the WorkerController class
// Find this method inside the class and DELETE it:
/*
evaluateTrialTaskResults(trialTaskResults) {
  // ... DELETE ALL THIS CODE FROM INSIDE THE CLASS ...
}
*/

module.exports = new WorkerController();