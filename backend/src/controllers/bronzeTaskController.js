/**
 * Enhanced Bronze Task Controller - Complete Workflow Implementation
 * Handles the full bronze task lifecycle: Post → Apply → Accept → Submit → Complete → Pay
 * 
 * NEW ENDPOINTS ADDED:
 * - Accept/reject applications
 * - Complete tasks and release payments
 * - WhatsApp integration simulation
 * - Enhanced status management
 */

const { prisma } = require('../config/database');
const bronzeTaskService = require('../services/bronzeTaskService');
const paymentController = require('./paymentController');

/**
 * Get bronze tasks by category with business context (EXISTING)
 */
const getBronzeTasksByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { workerId, search, ...filters } = req.query;

    console.log('📋 Getting bronze tasks by category:', { category, workerId, filters });

    let worker = null;
    if (workerId) {
      worker = await prisma.worker.findUnique({
        where: { id: workerId },
        include: { user: { select: { name: true } } }
      });

      if (!worker) {
        return res.status(404).json({
          success: false,
          error: 'Worker not found',
          message: 'Invalid worker ID'
        });
      }
    }

    // Get tasks from database with FIXED where clause
    const where = {
      // Remove isActive filter - use actual field names from your schema
    };

    // Add category filter if provided
    if (category && category !== 'all') {
      where.category = category.toUpperCase().replace('-', '_');
    }

    if (filters.maxBudget) {
      where.payAmount = { lte: parseFloat(filters.maxBudget) };
    }

    if (filters.difficulty) {
      where.difficulty = filters.difficulty;
    }

    if (filters.industry) {
      where.industry = filters.industry;
    }

    console.log('🔍 Database query where clause:', where);

    const tasks = await prisma.bronzeTask.findMany({
      where,
      include: {
        employer: {
          include: { user: { select: { name: true } } }
        },
        applications: {
          where: workerId ? { workerId } : {},
          select: { 
            id: true, 
            status: true,
            workerId: true
          }
        },
        _count: {
          select: { applications: true }
        }
      },
      orderBy: [
        { createdAt: 'desc' },
        { payAmount: 'desc' }
      ],
      take: parseInt(filters.limit) || 20
    });

    console.log(`📊 Found ${tasks.length} bronze tasks from database`);

    // Format for frontend with FIXED qualification logic
    const formattedTasks = tasks.map(bronzeTask => {
      // Check if worker has already applied
      const workerApplication = workerId ? 
        bronzeTask.applications.find(app => app.workerId === workerId) : null;

      // FIXED: Bronze tasks should be available to Bronze+ workers
      const isQualified = !worker || ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'].includes(worker.badge);
      const canApply = isQualified && !workerApplication && bronzeTask._count.applications < 10;

      console.log(`Task ${bronzeTask.id}: worker=${worker?.badge}, qualified=${isQualified}, canApply=${canApply}`);

      return {
        id: bronzeTask.id,
        title: bronzeTask.title,
        description: bronzeTask.description,
        category: bronzeTask.category,
        categoryDisplay: bronzeTask.category.split('_').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' '),
        payAmount: parseFloat(bronzeTask.payAmount),
        hourlyRate: Math.round(parseFloat(bronzeTask.payAmount) / (bronzeTask.duration / 60)),
        totalBudget: parseFloat(bronzeTask.payAmount),
        duration: bronzeTask.duration,
        estimatedHours: Math.round(bronzeTask.duration / 60),
        difficulty: bronzeTask.difficulty,
        skillTags: bronzeTask.skillTags,
        requiredSkills: bronzeTask.skillTags,
        industry: bronzeTask.industry,
        templates: bronzeTask.templates,
        instructionLanguage: bronzeTask.instructionLanguage,
        hasVoiceInstructions: bronzeTask.hasVoiceInstructions,
        recurring: bronzeTask.recurring,
        location: 'Remote',
        requiredBadge: 'BRONZE',
        employer: {
          name: bronzeTask.employer.user.name,
          isVerified: bronzeTask.employer.isVerified
        },
        applicationCount: bronzeTask._count.applications,
        applications: {
          total: bronzeTask._count.applications,
          canApply: canApply,
          workerHasApplied: !!workerApplication,
          workerApplication: workerApplication
        },
        // FIXED: Qualification logic
        compatibility: worker ? {
          score: isQualified ? 85 : 0,
          badgeMatch: worker.badge === 'BRONZE' ? 'perfect' : 'qualified',
          qualified: isQualified
        } : null,
        createdAt: bronzeTask.createdAt,
        businessValue: `Supports ${bronzeTask.industry || 'business'} operations and growth`
      };
    });

    console.log(`✅ Returning ${formattedTasks.length} formatted bronze tasks`);

    // Get category info
    const categories = bronzeTaskService.getBusinessSupportCategories();
    const categoryInfo = categories.find(cat => cat.id === category) || {
      id: category,
      name: category ? category.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ') : 'All Tasks',
      description: 'Business support tasks'
    };

    return res.json({
      success: true,
      data: {
        category: categoryInfo,
        tasks: formattedTasks,
        totalTasks: formattedTasks.length,
        filters: {
          applied: filters,
          available: {
            difficulties: ['beginner', 'intermediate', 'advanced'],
            industries: ['ecommerce', 'retail', 'services', 'manufacturing', 'technology'],
            languages: ['english', 'hindi', 'both']
          }
        },
        businessFocus: true
      }
    });

  } catch (error) {
    console.error('❌ Get bronze tasks by category error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch bronze tasks',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const getBronzeTaskCategories = async (req, res) => {
  try {
    console.log('📋 Getting bronze task categories...');

    // Get categories from bronze task service
    const categories = bronzeTaskService.getBusinessSupportCategories();

    // Get task counts for each category from database
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        try {
          const taskCount = await prisma.bronzeTask.count({
            where: {
              category: category.id.toUpperCase().replace('-', '_')
            }
          });

          return {
            ...category,
            taskCount: taskCount || 0
          };
        } catch (countError) {
          console.warn(`Warning: Could not get count for category ${category.id}:`, countError.message);
          return {
            ...category,
            taskCount: 0
          };
        }
      })
    );

    console.log(`✅ Returning ${categoriesWithCounts.length} bronze task categories`);

    return res.json({
      success: true,
      data: {
        categories: categoriesWithCounts,
        businessFocus: true
      }
    });

  } catch (error) {
    console.error('❌ Get bronze task categories error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch bronze task categories',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
/**
 * Apply for a bronze task (EXISTING)
 */
const applyForBronzeTask = async (req, res) => {
  try {
    const { id: taskId } = req.params;
    const { workerId, message } = req.body;

    console.log('📝 Worker applying for bronze task:', { taskId, workerId });

    // Validate required fields
    if (!workerId) {
      return res.status(400).json({
        success: false,
        error: 'Worker ID is required',
        message: 'Please provide worker ID'
      });
    }

    // Check if bronze task exists
    const bronzeTask = await prisma.bronzeTask.findUnique({
      where: { id: taskId },
      include: {
        employer: {
          include: { user: { select: { name: true } } }
        }
      }
    });

    if (!bronzeTask) {
      return res.status(404).json({
        success: false,
        error: 'Bronze task not found',
        message: 'Invalid bronze task ID'
      });
    }

    // Check if worker exists
    const worker = await prisma.worker.findUnique({
      where: { id: workerId },
      include: { user: { select: { name: true } } }
    });

    if (!worker) {
      return res.status(404).json({
        success: false,
        error: 'Worker not found',
        message: 'Invalid worker ID'
      });
    }

    // FIXED: Check if worker has Bronze badge or higher (simplified)
    const validBadges = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'];
    if (!validBadges.includes(worker.badge)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient badge level',
        message: 'Bronze badge or higher required for business support tasks'
      });
    }

    // Check if worker has already applied
    const existingApplication = await prisma.bronzeTaskApplication.findUnique({
      where: {
        bronzeTaskId_workerId: {
          bronzeTaskId: taskId,
          workerId: workerId
        }
      }
    });

    if (existingApplication) {
      return res.status(409).json({
        success: false,
        error: 'Application already exists',
        message: 'You have already applied for this bronze task'
      });
    }

    // Create bronze task application
    const application = await prisma.bronzeTaskApplication.create({
      data: {
        bronzeTaskId: taskId,
        workerId: workerId,
        message: message || `I'm interested in this ${bronzeTask.category.toLowerCase().replace('_', ' ')} task and believe I have the necessary skills.`,
        status: 'APPLIED'
      }
    });

    console.log('✅ Bronze task application created successfully:', application.id);

    return res.status(201).json({
      success: true,
      data: {
        application: {
          id: application.id,
          taskId: bronzeTask.id,
          taskTitle: bronzeTask.title,
          workerId: worker.id,
          workerName: worker.user.name,
          status: application.status,
          appliedAt: application.appliedAt,
          message: application.message
        },
        bronzeTask: {
          title: bronzeTask.title,
          category: bronzeTask.category,
          payAmount: parseFloat(bronzeTask.payAmount),
          employer: bronzeTask.employer.user.name
        }
      },
      message: 'Application submitted successfully'
    });

  } catch (error) {
    console.error('❌ Apply for bronze task error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to submit application',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 🆕 NEW: Accept or reject bronze task application (Employer endpoint)
 * PUT /api/bronze-tasks/:taskId/applications/:applicationId/status
 */
const updateBronzeTaskApplicationStatus = async (req, res) => {
  try {
    const { taskId, applicationId } = req.params;
    const { status, note } = req.body;

    console.log('🔄 Updating bronze task application status:', { applicationId, status });

    // Validate status
    const validStatuses = ['APPLIED', 'ACCEPTED', 'REJECTED', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Get application with full details
    const application = await prisma.bronzeTaskApplication.findUnique({
      where: { id: applicationId },
      include: {
        bronzeTask: {
          include: {
            employer: { include: { user: { select: { name: true, phone: true } } } }
          }
        },
        worker: { include: { user: { select: { name: true, phone: true } } } }
      }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found',
        message: 'Invalid application ID'
      });
    }

    if (application.bronzeTaskId !== taskId) {
      return res.status(400).json({
        success: false,
        error: 'Task ID mismatch',
        message: 'Application does not belong to specified task'
      });
    }

    // Update application status
    const updatedApplication = await prisma.bronzeTaskApplication.update({
      where: { id: applicationId },
      data: { status }
    });

    // 🆕 NEW: Handle different status transitions
    let responseData = {
      application: {
        id: updatedApplication.id,
        status: updatedApplication.status,
        bronzeTask: {
          title: application.bronzeTask.title,
          payAmount: parseFloat(application.bronzeTask.payAmount)
        },
        worker: {
          name: application.worker.user.name
        }
      }
    };

    // Handle ACCEPTED status - Setup WhatsApp connection and escrow payment
    if (status === 'ACCEPTED' && application.status !== 'ACCEPTED') {
      try {
        // 🆕 Create payment escrow when task is accepted
        const escrowResult = await createPaymentEscrow(
          application.bronzeTask.id,
          application.bronzeTask.employerId,
          parseFloat(application.bronzeTask.payAmount)
        );

        // 🆕 Simulate WhatsApp connection
        const whatsappConnection = await simulateWhatsAppConnection(
          application.worker.user,
          application.bronzeTask.employer.user,
          application.bronzeTask
        );

        responseData.whatsappConnection = whatsappConnection;
        responseData.paymentEscrow = escrowResult;
        
        console.log('✅ Task accepted: Payment escrowed and WhatsApp connected');
        
        return res.json({
          success: true,
          data: responseData,
          message: `Application accepted! Worker and employer connected via WhatsApp. Payment of ₹${application.bronzeTask.payAmount} secured in escrow.`
        });

      } catch (escrowError) {
        console.error('❌ Failed to setup escrow or WhatsApp:', escrowError);
        // Continue with acceptance but note the issue
        responseData.warning = 'Application accepted but payment escrow setup failed. Please set up payment manually.';
      }
    }

    // Handle COMPLETED status - Release payment
    if (status === 'COMPLETED' && application.status !== 'COMPLETED') {
      try {
        // 🆕 Release payment to worker
        const paymentResult = await releasePaymentToWorker(
          application.bronzeTask.id,
          application.workerId,
          application.worker.upiId || `${application.worker.user.phone}@paytm`, // Default UPI
          5, // Default rating
          'Task completed successfully', // Default feedback
          application.id // Pass application ID
        );

        // Update worker stats
        await prisma.worker.update({
          where: { id: application.workerId },
          data: {
            tasksCompleted: { increment: 1 },
            totalEarnings: { increment: parseFloat(application.bronzeTask.payAmount) }
          }
        });

        responseData.paymentRelease = paymentResult;
        
        console.log('✅ Task completed: Payment released to worker');
        
        return res.json({
          success: true,
          data: responseData,
          message: `Task completed! Payment of ₹${application.bronzeTask.payAmount} released to ${application.worker.user.name}.`
        });

      } catch (paymentError) {
        console.error('❌ Failed to release payment:', paymentError);
        responseData.error = 'Task marked complete but payment release failed. Please process payment manually.';
      }
    }

    console.log('✅ Bronze task application status updated successfully');

    return res.json({
      success: true,
      data: responseData,
      message: `Application ${status.toLowerCase()} successfully`
    });

  } catch (error) {
    console.error('❌ Update bronze task application status error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to update application status'
    });
  }
};

/**
 * 🆕 NEW: Get applications for a bronze task (Employer endpoint)
 * GET /api/bronze-tasks/:taskId/applications
 */
const getBronzeTaskApplications = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { status } = req.query;

    console.log('📋 Getting applications for bronze task:', { taskId, status });

    // Verify task exists
    const bronzeTask = await prisma.bronzeTask.findUnique({
      where: { id: taskId },
      include: {
        employer: { include: { user: { select: { name: true } } } }
      }
    });

    if (!bronzeTask) {
      return res.status(404).json({
        success: false,
        error: 'Bronze task not found',
        message: 'Invalid bronze task ID'
      });
    }

    // Build where clause
    const where = { bronzeTaskId: taskId };
    if (status) {
      where.status = status.toUpperCase();
    }

    // Get applications
    const applications = await prisma.bronzeTaskApplication.findMany({
      where,
      include: {
        worker: {
          include: { user: { select: { name: true, phone: true } } }
        }
      },
      orderBy: { appliedAt: 'desc' }
    });

    console.log(`✅ Found ${applications.length} applications for bronze task`);

    // Format for frontend
    const formattedApplications = applications.map(app => ({
      id: app.id,
      status: app.status,
      appliedAt: app.appliedAt,
      message: app.message,
      worker: {
        id: app.worker.id,
        name: app.worker.user.name,
        badge: app.worker.badge,
        skills: app.worker.skills,
        tasksCompleted: app.worker.tasksCompleted,
        averageRating: app.worker.averageRating ? parseFloat(app.worker.averageRating) : 0,
        experienceLevel: app.worker.experienceLevel
      }
    }));

    // Calculate stats
    const stats = {
      totalApplications: applications.length,
      byStatus: {
        APPLIED: applications.filter(app => app.status === 'APPLIED').length,
        ACCEPTED: applications.filter(app => app.status === 'ACCEPTED').length,
        REJECTED: applications.filter(app => app.status === 'REJECTED').length,
        COMPLETED: applications.filter(app => app.status === 'COMPLETED').length
      }
    };

    return res.json({
      success: true,
      data: {
        applications: formattedApplications,
        stats,
        bronzeTask: {
          id: bronzeTask.id,
          title: bronzeTask.title,
          category: bronzeTask.category,
          payAmount: parseFloat(bronzeTask.payAmount),
          employer: {
            name: bronzeTask.employer.user.name
          }
        }
      }
    });

  } catch (error) {
    console.error('❌ Get bronze task applications error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch applications'
    });
  }
};

/**
 * 🆕 NEW: Complete bronze task and release payment (Employer endpoint)
 * POST /api/bronze-tasks/:taskId/complete
 */
const completeBronzeTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { workerId, rating = 5, feedback = 'Task completed successfully' } = req.body;

    console.log('🏁 Completing bronze task:', { taskId, workerId, rating });

    // Validate required fields
    if (!workerId) {
      return res.status(400).json({
        success: false,
        error: 'Worker ID is required',
        message: 'Please provide worker ID'
      });
    }

    // Get task and application details
    const bronzeTask = await prisma.bronzeTask.findUnique({
      where: { id: taskId },
      include: {
        employer: { include: { user: { select: { name: true } } } }
      }
    });

    if (!bronzeTask) {
      return res.status(404).json({
        success: false,
        error: 'Bronze task not found',
        message: 'Invalid bronze task ID'
      });
    }

    // Find the accepted application
    const application = await prisma.bronzeTaskApplication.findFirst({
      where: {
        bronzeTaskId: taskId,
        workerId: workerId,
        status: 'ACCEPTED'
      },
      include: {
        worker: { include: { user: { select: { name: true, phone: true } } } }
      }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'No accepted application found',
        message: 'Worker must have an accepted application to complete task'
      });
    }

    // Update application to completed
    const updatedApplication = await prisma.bronzeTaskApplication.update({
      where: { id: application.id },
      data: { status: 'COMPLETED' }
    });

    // Release payment to worker
    try {
      const paymentResult = await releasePaymentToWorker(
        taskId,
        workerId,
        application.worker.upiId || `${application.worker.user.phone}@paytm`,
        rating,
        feedback,
        updatedApplication.id // Pass the application ID directly
      );

      // Update worker stats
      await prisma.worker.update({
        where: { id: workerId },
        data: {
          tasksCompleted: { increment: 1 },
          totalEarnings: { increment: parseFloat(bronzeTask.payAmount) }
        }
      });

      console.log('✅ Bronze task completed and payment released');

      return res.json({
        success: true,
        data: {
          task: {
            id: bronzeTask.id,
            title: bronzeTask.title,
            status: 'COMPLETED'
          },
          worker: {
            id: application.worker.id,
            name: application.worker.user.name
          },
          payment: paymentResult,
          rating,
          feedback
        },
        message: `Task completed! Payment of ₹${bronzeTask.payAmount} released to ${application.worker.user.name}.`
      });

    } catch (paymentError) {
      console.error('❌ Failed to release payment:', paymentError);
      
      // Revert application status if payment failed
      await prisma.bronzeTaskApplication.update({
        where: { id: application.id },
        data: { status: 'ACCEPTED' }
      });

      return res.status(500).json({
        success: false,
        error: 'Payment release failed',
        message: 'Task completion failed due to payment processing error'
      });
    }

  } catch (error) {
    console.error('❌ Complete bronze task error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to complete bronze task'
    });
  }
};

/**
 * 🆕 NEW: Get WhatsApp connection details (Simulation)
 * GET /api/bronze-tasks/:taskId/whatsapp
 */
const getWhatsAppConnection = async (req, res) => {
  try {
    const { taskId } = req.params;

    console.log('📱 Getting WhatsApp connection details for task:', taskId);

    // Get task and accepted application
    const application = await prisma.bronzeTaskApplication.findFirst({
      where: {
        bronzeTaskId: taskId,
        status: 'ACCEPTED'
      },
      include: {
        bronzeTask: {
          include: {
            employer: { include: { user: { select: { name: true, phone: true } } } }
          }
        },
        worker: { include: { user: { select: { name: true, phone: true } } } }
      }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'No accepted application found',
        message: 'WhatsApp connection only available for accepted tasks'
      });
    }

    // Simulate WhatsApp connection details
    const whatsappDetails = {
      groupId: `group_${taskId}_${Date.now()}`,
      groupName: `${application.bronzeTask.title.substring(0, 30)}...`,
      participants: [
        {
          name: application.bronzeTask.employer.user.name,
          phone: application.bronzeTask.employer.user.phone,
          role: 'employer'
        },
        {
          name: application.worker.user.name,
          phone: application.worker.user.phone,
          role: 'worker'
        }
      ],
      inviteLink: `https://chat.whatsapp.com/mock_${taskId}`,
      connectionStatus: 'active',
      createdAt: new Date(),
      instructions: [
        "1. Employer and worker are now connected via WhatsApp",
        "2. Worker can share task progress and files directly",
        "3. Employer can provide feedback and clarifications",
        "4. When work is complete, employer clicks 'Finish Task' to release payment"
      ]
    };

    return res.json({
      success: true,
      data: {
        whatsapp: whatsappDetails,
        task: {
          id: application.bronzeTask.id,
          title: application.bronzeTask.title,
          payAmount: parseFloat(application.bronzeTask.payAmount)
        }
      },
      message: 'WhatsApp connection active'
    });

  } catch (error) {
    console.error('❌ Get WhatsApp connection error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to get WhatsApp connection details'
    });
  }
};

/**
 * Get worker's bronze task applications (EXISTING)
 */
const getWorkerBronzeTaskApplications = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { status, category } = req.query;

    console.log('📋 Getting bronze task applications for worker:', workerId);

    const worker = await prisma.worker.findUnique({
      where: { id: workerId },
      include: { user: { select: { name: true } } }
    });

    if (!worker) {
      return res.status(404).json({
        success: false,
        error: 'Worker not found',
        message: 'Invalid worker ID'
      });
    }

    const where = { workerId };
    if (status) {
      where.status = status.toUpperCase();
    }
    if (category) {
      where.bronzeTask = {
        category: category.toUpperCase().replace('-', '_')
      };
    }

    const applications = await prisma.bronzeTaskApplication.findMany({
      where,
      include: {
        bronzeTask: {
          include: {
            employer: {
              include: { user: { select: { name: true } } }
            }
          }
        }
      },
      orderBy: { appliedAt: 'desc' }
    });

    console.log(`✅ Found ${applications.length} bronze task applications`);

    const formattedApplications = applications.map(app => ({
      id: app.id,
      status: app.status,
      appliedAt: app.appliedAt,
      message: app.message,
      bronzeTask: {
        id: app.bronzeTask.id,
        title: app.bronzeTask.title,
        category: app.bronzeTask.category,
        payAmount: parseFloat(app.bronzeTask.payAmount),
        duration: app.bronzeTask.duration,
        difficulty: app.bronzeTask.difficulty,
        industry: app.bronzeTask.industry,
        employer: {
          name: app.bronzeTask.employer.user.name,
          isVerified: app.bronzeTask.employer.isVerified
        }
      }
    }));

    const stats = {
      totalApplications: applications.length,
      byStatus: {
        APPLIED: applications.filter(app => app.status === 'APPLIED').length,
        ACCEPTED: applications.filter(app => app.status === 'ACCEPTED').length,
        REJECTED: applications.filter(app => app.status === 'REJECTED').length,
        COMPLETED: applications.filter(app => app.status === 'COMPLETED').length
      },
      totalEarnings: applications
        .filter(app => app.status === 'COMPLETED')
        .reduce((sum, app) => sum + parseFloat(app.bronzeTask.payAmount), 0)
    };

    return res.json({
      success: true,
      data: {
        applications: formattedApplications,
        stats,
        worker: {
          id: worker.id,
          name: worker.user.name,
          badge: worker.badge,
          businessTasksCompleted: stats.byStatus.COMPLETED
        }
      }
    });

  } catch (error) {
    console.error('❌ Get worker bronze task applications error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch applications'
    });
  }
};

/**
 * Create a new bronze task with file attachments (ENHANCED)
 */
const createBronzeTask = async (req, res) => {
  try {
    const {
      employerId,
      title,
      description,
      category,
      duration,
      payAmount,
      difficulty = 'beginner',
      skillTags = [],
      industry = 'general',
      attachmentDescriptions = []
    } = req.body;

    console.log('➕ Creating bronze task:', { title, category, employerId });
    console.log('📋 Request body:', req.body);
    console.log('📎 Files:', req.files ? req.files.length : 0);

    if (!employerId || !title || !description || !category || !duration || !payAmount) {
      // Cleanup uploaded files if validation fails
      if (req.attachmentInfo && req.attachmentInfo.length > 0) {
        const { cleanupFiles } = require('../middleware/taskFileUpload');
        cleanupFiles(req.files);
      }
      
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'All task details are required'
      });
    }

    // Parse skillTags if it's a string (handle JSON string case)
    let parsedSkillTags = [];
    if (Array.isArray(skillTags)) {
      parsedSkillTags = skillTags;
    } else if (typeof skillTags === 'string') {
      try {
        // Try to parse as JSON first (from FormData)
        const jsonParsed = JSON.parse(skillTags);
        parsedSkillTags = Array.isArray(jsonParsed) ? jsonParsed : [jsonParsed];
      } catch (e) {
        // Fallback to comma-separated string
        parsedSkillTags = skillTags.split(',').map(s => s.trim());
      }
    }

    // Convert category to uppercase enum format
    const categoryEnum = category ? category.toUpperCase().replace('-', '_') : null;

    console.log('📊 Parsed values:', {
      originalCategory: category,
      categoryEnum,
      originalSkillTags: skillTags,
      parsedSkillTags
    });

    // Parse attachment descriptions if provided
    const parsedAttachmentDescriptions = Array.isArray(attachmentDescriptions) ? attachmentDescriptions :
      (typeof attachmentDescriptions === 'string' ? attachmentDescriptions.split(',').map(s => s.trim()) : []);

    const bronzeTask = await prisma.bronzeTask.create({
      data: {
        employerId,
        title: title.trim(),
        description: description.trim(),
        category: categoryEnum,
        duration: parseInt(duration),
        payAmount: parseFloat(payAmount),
        difficulty,
        skillTags: parsedSkillTags,
        industry,
        recurring: false,
        minAccuracy: 95.0,
        minTasksCompleted: 0,
        instructionLanguage: 'english',
        hasVoiceInstructions: false
      },
      include: {
        employer: {
          include: { user: { select: { name: true } } }
        }
      }
    });

    // Handle file attachments if present
    let attachments = [];
    if (req.attachmentInfo && req.attachmentInfo.length > 0) {
      try {
        const attachmentPromises = req.attachmentInfo.map((fileInfo, index) => {
          return prisma.taskAttachment.create({
            data: {
              taskId: bronzeTask.id,
              fileName: fileInfo.originalName,
              filePath: fileInfo.filePath,
              fileSize: fileInfo.fileSize,
              mimeType: fileInfo.mimeType,
              fileType: fileInfo.fileType,
              description: parsedAttachmentDescriptions[index] || `Attachment ${index + 1}`,
              isRequired: false
            }
          });
        });

        attachments = await Promise.all(attachmentPromises);
        console.log(`✅ ${attachments.length} attachments saved for task ${bronzeTask.id}`);
        
      } catch (attachmentError) {
        console.error('❌ Failed to save attachments:', attachmentError);
        // Don't fail the task creation, but log the error
        const { cleanupFiles } = require('../middleware/taskFileUpload');
        cleanupFiles(req.files);
      }
    }

    await prisma.employer.update({
      where: { id: employerId },
      data: { tasksPosted: { increment: 1 } }
    });

    console.log('✅ Bronze task created successfully:', bronzeTask.id);

    return res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: {
        task: {
          id: bronzeTask.id,
          title: bronzeTask.title,
          description: bronzeTask.description,
          category: bronzeTask.category,
          estimatedHours: Math.round(bronzeTask.duration / 60),
          hourlyRate: Math.round(bronzeTask.payAmount / (bronzeTask.duration / 60)),
          totalBudget: bronzeTask.payAmount,
          requiredSkills: bronzeTask.skillTags,
          requiredBadge: 'BRONZE',
          status: 'AVAILABLE',
          urgency: 'normal',
          location: 'Remote',
          maxApplications: 10,
          deadline: null,
          startDate: null,
          attachments: attachments.map(att => ({
            id: att.id,
            fileName: att.fileName,
            fileType: att.fileType,
            description: att.description,
            fileSize: att.fileSize
          })),
          employer: bronzeTask.employer,
          applications: [],
          createdAt: bronzeTask.createdAt
        }
      }
    });

  } catch (error) {
    console.error('❌ Create bronze task error:', error);
    
    // Cleanup uploaded files on error
    if (req.attachmentInfo && req.attachmentInfo.length > 0) {
      const { cleanupFiles } = require('../middleware/taskFileUpload');
      cleanupFiles(req.files);
    }
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create bronze task'
    });
  }
};

/**
 * Get bronze task success metrics for worker (EXISTING)
 */
const getWorkerBronzeTaskMetrics = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { category } = req.query;

    console.log('📊 Getting bronze task metrics for worker:', workerId);

    const result = await bronzeTaskService.getSuccessMetrics(workerId, category);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to fetch metrics',
        message: result.message || 'Unknown error occurred'
      });
    }

    console.log('✅ Bronze task metrics compiled');

    return res.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('❌ Get bronze task metrics error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch bronze task metrics'
    });
  }
};

// 🆕 HELPER FUNCTIONS

/**
 * Create payment escrow for accepted task
 */
async function createPaymentEscrow(taskId, employerId, amount) {
  try {
    console.log('🔒 Creating payment escrow:', { taskId, employerId, amount });

    // Find employer's active mandate
    const mandate = await prisma.uPIMandate.findFirst({
      where: { 
        employerId, 
        status: 'ACTIVE',
        validUntil: { gt: new Date() }
      }
    });

    if (!mandate) {
      throw new Error('No active UPI mandate found for employer');
    }

    // Create payment record in escrow
    const payment = await prisma.payment.create({
      data: {
        taskId,
        employerId,
        amount: parseFloat(amount),
        status: 'ESCROWED',
        mandateId: mandate.id,
        upiId: mandate.upiId,
        escrowedAt: new Date(),
        escrowMethod: 'UPI',
        bankName: mandate.bankName,
        transactionId: generateTransactionId(),
        paymentNote: `Task payment escrowed automatically on task acceptance`
      }
    });

    console.log('✅ Payment escrowed successfully:', payment.transactionId);
    return payment;

  } catch (error) {
    console.error('❌ Payment escrow failed:', error);
    throw error;
  }
}

/**
 * Release payment to worker
 */
async function releasePaymentToWorker(taskId, workerId, workerUpiId, rating = 5, feedback = '', applicationId = null) {
  try {
    console.log('💸 Releasing payment to worker:', { taskId, workerId, workerUpiId, rating, applicationId });

    // Get escrowed payment
    const payment = await prisma.payment.findFirst({
      where: { 
        taskId,
        status: 'ESCROWED'
      }
    });

    if (!payment) {
      throw new Error('No escrowed payment found for this task');
    }

    // Find or use the provided application for rating
    let application;
    if (applicationId) {
      // Application ID provided - just get the basic data needed for rating
      application = await prisma.bronzeTaskApplication.findUnique({
        where: { id: applicationId },
        include: {
          bronzeTask: {
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
    } else {
      // Find the application to get the application ID for rating
      // Look for both ACCEPTED and COMPLETED status since status might already be updated
      application = await prisma.bronzeTaskApplication.findFirst({
        where: {
          bronzeTaskId: taskId,
          workerId: workerId,
          status: {
            in: ['ACCEPTED', 'COMPLETED']
          }
        },
        include: {
          bronzeTask: {
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
    }

    if (!application) {
      throw new Error('No application found for rating submission');
    }

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        workerId,
        workerUpiId: workerUpiId.toLowerCase(),
        status: 'COMPLETED',
        completedAt: new Date(),
        transactionId: generateTransactionId(),
        paymentNote: `Payment released to worker - Rating: ${rating}/5`
      }
    });

    // Submit rating to the rating system
    try {
      console.log('⭐ Submitting employer rating for worker...');
      
      const ratingData = {
        taskId: taskId,
        applicationId: application.id,
        raterType: 'EMPLOYER',
        employerId: application.bronzeTask.employerId,
        ratedWorkerId: workerId,
        stars: parseInt(rating)
      };

      const submittedRating = await prisma.rating.create({
        data: ratingData
      });

      console.log('✅ Rating submitted successfully:', submittedRating.id);

      // Update worker's average rating
      const ratingService = require('../services/ratingService');
      await ratingService.updateAverageRatings(workerId, 'WORKER');

    } catch (ratingError) {
      console.error('❌ Failed to submit rating:', ratingError);
      // Don't fail the payment if rating fails
    }

    // Update worker total earnings and UPI
    await prisma.worker.update({
      where: { id: workerId },
      data: {
        totalEarnings: { increment: parseFloat(payment.amount) },
        upiId: workerUpiId.toLowerCase()
      }
    });

    console.log('✅ Payment released successfully:', updatedPayment.transactionId);
    return updatedPayment;

  } catch (error) {
    console.error('❌ Payment release failed:', error);
    throw error;
  }
}

/**
 * Simulate WhatsApp connection between employer and worker
 */
async function simulateWhatsAppConnection(worker, employer, task) {
  console.log('📱 Setting up WhatsApp connection:', { 
    worker: worker.name, 
    employer: employer.name, 
    task: task.title 
  });

  // Simulate WhatsApp group creation
  const whatsappConnection = {
    groupId: `nanojobs_${task.id}_${Date.now()}`,
    groupName: `NanoJobs: ${task.title.substring(0, 20)}...`,
    participants: [
      {
        name: employer.name,
        phone: employer.phone,
        role: 'employer',
        joinedAt: new Date()
      },
      {
        name: worker.name,
        phone: worker.phone,
        role: 'worker',
        joinedAt: new Date()
      }
    ],
    inviteLink: `https://chat.whatsapp.com/mock_${task.id}`,
    instructions: [
      `🎯 Task: ${task.title}`,
      `💰 Payment: ₹${task.payAmount} (secured in escrow)`,
      `⏱️ Duration: ${Math.round(task.duration / 60)} hours`,
      '',
      '📋 Instructions:',
      '• Worker can share progress and files here',
      '• Employer can provide feedback and clarifications', 
      '• When work is complete, employer clicks "Finish Task"',
      '• Payment will be released automatically to worker'
    ].join('\n'),
    status: 'active',
    createdAt: new Date()
  };

  console.log('✅ WhatsApp connection simulated successfully');
  return whatsappConnection;
}

/**
 * Generate realistic transaction ID
 */
function generateTransactionId() {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN${timestamp.slice(-6)}${random}`;
}

/**
 * 🆕 NEW: Get detailed task information with attachments and submissions
 * GET /api/bronze-tasks/:taskId/details
 */
const getBronzeTaskDetails = async (req, res) => {
  try {
    const { taskId } = req.params;
    // Get userId from JWT token (set by auth middleware) or fallback to query param
    const userId = req.userId || req.query.userId;

    console.log('📋 Getting bronze task details:', { taskId, userId });
    console.log('🔍 DEBUG - getBronzeTaskDetails called with:', { 
      taskId, 
      userId, 
      hasUserId: !!userId,
      queryUserId: req.query.userId,
      reqUserId: req.userId
    });

    // Get task with all related data
    const bronzeTask = await prisma.bronzeTask.findUnique({
      where: { id: taskId },
      include: {
        employer: {
          include: { user: { select: { id: true, name: true, phone: true } } }
        },
        attachments: {
          orderBy: { uploadedAt: 'desc' }
        },
        applications: {
          include: {
            worker: {
              include: { user: { select: { id: true, name: true, phone: true } } }
            },
            submission: {
              include: {
                files: {
                  orderBy: { uploadedAt: 'desc' }
                }
              }
            }
          }
        },
        payments: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!bronzeTask) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
        message: 'Invalid task ID'
      });
    }

    // Determine user's role in this task
    let userRole = 'public';
    let userApplication = null;
    
    if (userId) {
      // Check if user is the employer (handle both User ID and Employer ID)
      if (bronzeTask.employer.user.id === userId || bronzeTask.employer.id === userId) {
        userRole = 'employer';
        console.log('🔍 DEBUG - Employer identified:', {
          userId: userId,
          employerUserId: bronzeTask.employer.user.id,
          employerId: bronzeTask.employer.id,
          matchedBy: bronzeTask.employer.user.id === userId ? 'user.id' : 'employer.id'
        });
      } else {
        // Check if userId is actually a User ID or Worker ID
        let worker = null;
        let user = null;
        
        // First try to find user by User ID
        user = await prisma.user.findUnique({
          where: { id: userId },
          include: { worker: true }
        });
        
        if (user && user.worker) {
          worker = user.worker;
        } else {
          // If not found, try to find worker by Worker ID directly
          worker = await prisma.worker.findUnique({
            where: { id: userId },
            include: { user: true }
          });
          if (worker) {
            user = worker.user;
          }
        }
        
        console.log('🔍 DEBUG - User/Worker lookup result:', {
          userId: userId,
          userFound: !!user,
          workerFound: !!worker,
          workerId: worker?.id
        });
        
        if (worker) {
          console.log('🔍 DEBUG - Looking for user application:', {
            userId: userId,
            workerId: worker.id,
            applicationsCount: bronzeTask.applications.length,
            applicationWorkerIds: bronzeTask.applications.map(app => ({ id: app.id, workerId: app.workerId, status: app.status }))
          });
          userApplication = bronzeTask.applications.find(app => app.workerId === worker.id);
          console.log('🔍 DEBUG - Found userApplication:', {
            found: !!userApplication,
            userApplication: userApplication
          });
          if (userApplication) {
            userRole = 'applicant';
          }
        } else {
          console.log('🔍 DEBUG - No worker found for userId');
        }
      }
    }

    // Format task data based on user role
    const taskData = {
      id: bronzeTask.id,
      title: bronzeTask.title,
      description: bronzeTask.description,
      category: bronzeTask.category,
      categoryDisplay: bronzeTask.category.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' '),
      duration: bronzeTask.duration,
      estimatedHours: Math.round(bronzeTask.duration / 60),
      payAmount: parseFloat(bronzeTask.payAmount),
      hourlyRate: Math.round(parseFloat(bronzeTask.payAmount) / (bronzeTask.duration / 60)),
      difficulty: bronzeTask.difficulty,
      skillTags: bronzeTask.skillTags,
      industry: bronzeTask.industry,
      instructionLanguage: bronzeTask.instructionLanguage,
      hasVoiceInstructions: bronzeTask.hasVoiceInstructions,
      recurring: bronzeTask.recurring,
      createdAt: bronzeTask.createdAt,
      updatedAt: bronzeTask.updatedAt,
      
      // Employer information (limited based on role)
      employer: {
        name: bronzeTask.employer.user.name,
        isVerified: bronzeTask.employer.isVerified,
        ...(userRole === 'employer' || userRole === 'applicant' ? {
          phone: bronzeTask.employer.user.phone
        } : {})
      },

      // Task attachments (employer uploads)
      attachments: bronzeTask.attachments.map(att => ({
        id: att.id,
        fileName: att.fileName,
        fileType: att.fileType,
        fileSize: att.fileSize,
        description: att.description,
        isRequired: att.isRequired,
        uploadedAt: att.uploadedAt
      })),

      // Applications summary
      applications: {
        total: bronzeTask.applications.length,
        pending: bronzeTask.applications.filter(app => app.status === 'APPLIED').length,
        accepted: bronzeTask.applications.filter(app => app.status === 'ACCEPTED').length,
        completed: bronzeTask.applications.filter(app => app.status === 'COMPLETED').length,
        canApply: userRole === 'public' || (userRole !== 'employer' && !userApplication)
      },

      // Payment status
      payment: {
        status: bronzeTask.payments[0]?.status || 'PENDING',
        amount: bronzeTask.payments[0] ? parseFloat(bronzeTask.payments[0].amount) : parseFloat(bronzeTask.payAmount),
        transactionId: bronzeTask.payments[0]?.transactionId
      },

      // User-specific data
      userRole,
      userApplication: userApplication ? {
        id: userApplication.id,
        status: userApplication.status,
        appliedAt: userApplication.appliedAt,
        message: userApplication.message,
        submission: userApplication.submission ? {
          id: userApplication.submission.id,
          status: userApplication.submission.status,
          submissionType: userApplication.submission.submissionType,
          textContent: userApplication.submission.textContent,
          submittedAt: userApplication.submission.submittedAt,
          reviewNote: userApplication.submission.reviewNote,
          files: userApplication.submission.files.map(file => ({
            id: file.id,
            fileName: file.fileName,
            fileType: file.fileType,
            fileSize: file.fileSize,
            description: file.description,
            uploadedAt: file.uploadedAt
          }))
        } : null
      } : null
    };

    // Add application details for employers
    if (userRole === 'employer') {
      taskData.allApplications = bronzeTask.applications.map(app => ({
        id: app.id,
        status: app.status,
        appliedAt: app.appliedAt,
        message: app.message,
        worker: {
          id: app.worker.id,
          name: app.worker.user.name,
          phone: app.worker.user.phone,
          badge: app.worker.badge,
          skills: app.worker.skills,
          tasksCompleted: app.worker.tasksCompleted,
          averageRating: app.worker.averageRating ? parseFloat(app.worker.averageRating) : 0
        },
        submission: app.submission ? {
          id: app.submission.id,
          status: app.submission.status,
          submissionType: app.submission.submissionType,
          textContent: app.submission.textContent,
          submittedAt: app.submission.submittedAt,
          files: app.submission.files.map(file => ({
            id: file.id,
            fileName: file.fileName,
            fileType: file.fileType,
            fileSize: file.fileSize,
            description: file.description,
            uploadedAt: file.uploadedAt
          }))
        } : null
      }));
    }

    console.log(`✅ Task details retrieved for user role: ${userRole}`);

    return res.json({
      success: true,
      data: {
        task: taskData
      }
    });

  } catch (error) {
    console.error('❌ Get bronze task details error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch task details'
    });
  }
};

/**
 * 🆕 NEW: Upload task attachments (Employer can add files anytime)
 * POST /api/bronze-tasks/:taskId/attachments
 */
const uploadTaskAttachments = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { descriptions } = req.body;
    const files = req.files || [];

    console.log('📎 Uploading task attachments:', { taskId, fileCount: files.length });

    // Verify task exists and user is the employer
    const task = await prisma.bronzeTask.findFirst({
      where: { id: taskId },
      include: { employer: true }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
        message: 'Invalid task ID'
      });
    }

    // Check if user is the task employer
    if (task.employer.id !== req.employerId && task.employerId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only the task employer can upload attachments'
      });
    }

    if (files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded',
        message: 'Please select files to upload'
      });
    }

    // Parse descriptions (comma-separated or general description)
    const descriptionList = descriptions ? descriptions.split(',').map(d => d.trim()) : [];

    // Create attachment records
    const attachments = await Promise.all(
      files.map(async (file, index) => {
        return await prisma.taskAttachment.create({
          data: {
            taskId: taskId,
            fileName: file.originalname,
            filePath: file.path,
            fileSize: file.size,
            mimeType: file.mimetype,
            fileType: file.mimetype.startsWith('image/') ? 'image' : 
                     file.mimetype.includes('pdf') ? 'document' :
                     file.mimetype.includes('word') ? 'document' :
                     file.mimetype.includes('sheet') ? 'spreadsheet' : 'other',
            description: descriptionList[index] || descriptions || `Attachment ${index + 1}`,
            isRequired: false
          }
        });
      })
    );

    console.log(`✅ Created ${attachments.length} task attachments`);

    return res.json({
      success: true,
      data: { 
        attachments: attachments.map(att => ({
          id: att.id,
          fileName: att.fileName,
          fileSize: att.fileSize,
          mimeType: att.mimeType,
          fileType: att.fileType,
          description: att.description,
          uploadedAt: att.uploadedAt
        }))
      },
      message: `Successfully uploaded ${attachments.length} attachment(s)`
    });

  } catch (error) {
    console.error('❌ Upload task attachments error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to upload attachments'
    });
  }
};

/**
 * 🆕 NEW: Download task attachment
 * GET /api/bronze-tasks/:taskId/attachments/:attachmentId/download
 */
const downloadTaskAttachment = async (req, res) => {
  try {
    const { taskId, attachmentId } = req.params;

    console.log('📎 Downloading task attachment:', { taskId, attachmentId });

    // Get attachment details
    const attachment = await prisma.taskAttachment.findFirst({
      where: { 
        id: attachmentId,
        taskId: taskId 
      }
    });

    if (!attachment) {
      return res.status(404).json({
        success: false,
        error: 'Attachment not found',
        message: 'Invalid attachment ID'
      });
    }

    // Serve the file
    const { serveFile } = require('../middleware/taskFileUpload');
    serveFile(attachment.filePath, attachment.fileName, res);

  } catch (error) {
    console.error('❌ Download task attachment error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to download attachment'
    });
  }
};

module.exports = {
  getBronzeTasksByCategory,
  getBronzeTaskCategories,
  applyForBronzeTask,
  getWorkerBronzeTaskApplications,
  createBronzeTask,
  getWorkerBronzeTaskMetrics,
  
  // 🆕 NEW ENDPOINTS
  updateBronzeTaskApplicationStatus,
  getBronzeTaskApplications,
  completeBronzeTask,
  getWhatsAppConnection,
  getBronzeTaskDetails,
  uploadTaskAttachments,
  downloadTaskAttachment
};