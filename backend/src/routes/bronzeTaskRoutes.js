/**
 * Enhanced Bronze Task Routes - Complete Workflow
 * All routes for the full bronze task lifecycle
 * 
 * NEW ROUTES ADDED:
 * - Accept/reject applications
 * - Get task applications
 * - Complete tasks
 * - WhatsApp integration endpoints
 */

const express = require('express');
const router = express.Router();
const { prisma } = require('../config/database');
// Import controller
const bronzeTaskController = require('../controllers/bronzeTaskController');

// Import middleware
const authMiddleware = require('../middleware/auth');
const { handleTaskAttachments } = require('../middleware/taskFileUpload');

// Import chat routes
const chatRoutes = require('./chatRoutes');

// Bronze Task Routes

/**
 * @route   GET /api/bronze-tasks/categories
 * @desc    Get all bronze task categories with business context
 * @access  Public
 */
router.get('/categories', bronzeTaskController.getBronzeTaskCategories);

/**
 * @route   GET /api/bronze-tasks/:category
 * @desc    Get bronze tasks by category
 * @access  Public (with workerId for filtering)
 * @query   workerId, search, industry, difficulty, maxBudget, language, etc.
 */
router.get('/:category', bronzeTaskController.getBronzeTasksByCategory);

/**
 * @route   POST /api/bronze-tasks/:taskId/apply
 * @desc    Apply for a bronze task
 * @access  Protected (Worker)
 * @body    workerId, message
 */
router.post('/:taskId/apply', authMiddleware.authenticateToken, bronzeTaskController.applyForBronzeTask);

/**
 * @route   GET /api/bronze-tasks/worker/:workerId/applications
 * @desc    Get worker's bronze task applications
 * @access  Protected (Worker/Admin)
 * @query   status, category
 */
router.get('/worker/:workerId/applications', authMiddleware.authenticateToken, bronzeTaskController.getWorkerBronzeTaskApplications);

/**
 * @route   GET /api/bronze-tasks/worker/:workerId/metrics
 * @desc    Get bronze task success metrics for worker
 * @access  Protected (Worker/Admin)
 * @query   category
 */
router.get('/worker/:workerId/metrics', authMiddleware.authenticateToken, bronzeTaskController.getWorkerBronzeTaskMetrics);

/**
 * @route   POST /api/bronze-tasks
 * @desc    Create a new bronze task with attachments (Employer)
 * @access  Protected (Employer)
 * @files   attachments[] - Array of task attachment files (optional)
 * @body    employerId, title, description, category, duration, payAmount, etc.
 */
router.post('/', 
  authMiddleware.authenticateToken, 
  handleTaskAttachments,
  bronzeTaskController.createBronzeTask
);

// 🆕 NEW ROUTES FOR COMPLETE WORKFLOW

/**
 * @route   GET /api/bronze-tasks/:taskId/applications
 * @desc    Get all applications for a bronze task (Employer)
 * @access  Protected (Employer)
 * @query   status
 */
router.get('/:taskId/applications', authMiddleware.authenticateToken, bronzeTaskController.getBronzeTaskApplications);

/**
 * @route   PUT /api/bronze-tasks/:taskId/applications/:applicationId/status
 * @desc    Accept or reject bronze task application (Employer)
 * @access  Protected (Employer)
 * @body    status, note
 */
router.put('/:taskId/applications/:applicationId/status', authMiddleware.authenticateToken, bronzeTaskController.updateBronzeTaskApplicationStatus);

/**
 * @route   POST /api/bronze-tasks/:taskId/complete
 * @desc    Complete bronze task and release payment (Employer)
 * @access  Protected (Employer)
 * @body    workerId, rating, feedback
 */
router.post('/:taskId/complete', authMiddleware.authenticateToken, bronzeTaskController.completeBronzeTask);

/**
 * @route   GET /api/bronze-tasks/:taskId/whatsapp
 * @desc    Get WhatsApp connection details for task
 * @access  Protected (Employer/Worker)
 */
router.get('/:taskId/whatsapp', authMiddleware.authenticateToken, bronzeTaskController.getWhatsAppConnection);

/**
 * @route   GET /api/bronze-tasks/:taskId/details
 * @desc    Get detailed task information with attachments and submissions
 * @access  Protected (for authenticated users)
 * @query   userId - User ID for role-based data
 */
router.get('/:taskId/details', authMiddleware.authenticateToken, bronzeTaskController.getBronzeTaskDetails);

/**
 * @route   POST /api/bronze-tasks/:taskId/attachments
 * @desc    Upload additional task attachments (Employer can add anytime)
 * @access  Protected (Employer only)
 * @files   attachments[] - Array of attachment files
 * @body    descriptions - Optional descriptions for files
 */
router.post('/:taskId/attachments', 
  authMiddleware.authenticateToken, 
  handleTaskAttachments,
  bronzeTaskController.uploadTaskAttachments
);

/**
 * @route   GET /api/bronze-tasks/:taskId/attachments/:attachmentId/download
 * @desc    Download task attachment file
 * @access  Protected (for authenticated users)
 */
router.get('/:taskId/attachments/:attachmentId/download', authMiddleware.authenticateToken, bronzeTaskController.downloadTaskAttachment);

/**
 * @route   GET /api/bronze-tasks/:taskId/submissions
 * @desc    Get submissions for a task (Employer view)
 * @access  Protected (Employer)
 * @query   userId, status
 */
router.get('/:taskId/submissions', 
  authMiddleware.authenticateToken, 
  require('../controllers/taskSubmissionController').getTaskSubmissions
);

// 🆕 BULK OPERATIONS (OPTIONAL - FOR FUTURE)

/**
 * @route   POST /api/bronze-tasks/bulk/accept-applications
 * @desc    Accept multiple applications at once
 * @access  Protected (Employer)
 * @body    applicationIds[]
 */
router.post('/bulk/accept-applications', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { applicationIds } = req.body;
    
    if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Application IDs array is required',
        message: 'Please provide an array of application IDs'
      });
    }

    console.log('🔄 Bulk accepting applications:', applicationIds);

    // Update all applications to ACCEPTED
    const updateResult = await prisma.bronzeTaskApplication.updateMany({
      where: {
        id: { in: applicationIds },
        status: 'APPLIED' // Only accept applications that are currently applied
      },
      data: {
        status: 'ACCEPTED'
      }
    });

    console.log(`✅ Bulk accepted ${updateResult.count} applications`);

    return res.json({
      success: true,
      data: {
        acceptedCount: updateResult.count,
        applicationIds
      },
      message: `Successfully accepted ${updateResult.count} applications`
    });

  } catch (error) {
    console.error('❌ Bulk accept applications error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to accept applications'
    });
  }
});

/**
 * @route   GET /api/bronze-tasks/employer/:employerId/dashboard
 * @desc    Get employer dashboard data for bronze tasks
 * @access  Protected (Employer)
 */
router.get('/employer/:employerId/dashboard', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { employerId } = req.params;

    console.log('📊 Getting employer bronze task dashboard:', employerId);

    // Get all bronze tasks for employer
    const bronzeTasks = await prisma.bronzeTask.findMany({
      where: { employerId },
      include: {
        applications: {
          include: {
            worker: {
              include: { user: { select: { name: true } } }
            }
          }
        },
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate statistics
    const stats = {
      totalTasks: bronzeTasks.length,
      activeTasks: bronzeTasks.filter(t => t.applications.some(app => app.status === 'ACCEPTED')).length,
      completedTasks: bronzeTasks.filter(t => t.applications.some(app => app.status === 'COMPLETED')).length,
      totalApplications: bronzeTasks.reduce((sum, task) => sum + task.applications.length, 0),
      pendingApplications: bronzeTasks.reduce((sum, task) => sum + task.applications.filter(app => app.status === 'APPLIED').length, 0),
      totalSpent: bronzeTasks.reduce((sum, task) => {
        const completedPayments = task.payments.filter(p => p.status === 'COMPLETED');
        return sum + completedPayments.reduce((pSum, payment) => pSum + parseFloat(payment.amount), 0);
      }, 0),
      escrowedAmount: bronzeTasks.reduce((sum, task) => {
        const escrowedPayments = task.payments.filter(p => p.status === 'ESCROWED');
        return sum + escrowedPayments.reduce((pSum, payment) => pSum + parseFloat(payment.amount), 0);
      }, 0)
    };

    // Format tasks for dashboard
    const formattedTasks = bronzeTasks.map(task => ({
      id: task.id,
      title: task.title,
      category: task.category,
      payAmount: parseFloat(task.payAmount),
      duration: task.duration,
      createdAt: task.createdAt,
      applications: {
        total: task.applications.length,
        pending: task.applications.filter(app => app.status === 'APPLIED').length,
        accepted: task.applications.filter(app => app.status === 'ACCEPTED').length,
        completed: task.applications.filter(app => app.status === 'COMPLETED').length
      },
      payment: {
        status: task.payments[0]?.status || 'PENDING',
        amount: task.payments[0] ? parseFloat(task.payments[0].amount) : 0,
        transactionId: task.payments[0]?.transactionId
      }
    }));

    console.log('✅ Employer dashboard data compiled');

    return res.json({
      success: true,
      data: {
        stats,
        tasks: formattedTasks
      }
    });

  } catch (error) {
    console.error('❌ Get employer dashboard error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch dashboard data'
    });
  }
});

/**
 * @route   GET /api/bronze-tasks/worker/:workerId/dashboard
 * @desc    Get worker dashboard data for bronze tasks
 * @access  Protected (Worker)
 */
router.get('/worker/:workerId/dashboard', authMiddleware.authenticateToken, async (req, res) => {
  try {
    const { workerId } = req.params;

    console.log('📊 Getting worker bronze task dashboard:', workerId);

    // Get all applications for worker
    const applications = await prisma.bronzeTaskApplication.findMany({
      where: { workerId },
      include: {
        bronzeTask: {
          include: {
            employer: {
              include: { user: { select: { name: true } } }
            },
            payments: true
          }
        }
      },
      orderBy: { appliedAt: 'desc' }
    });

    // Calculate statistics
    const stats = {
      totalApplications: applications.length,
      acceptedTasks: applications.filter(app => app.status === 'ACCEPTED').length,
      completedTasks: applications.filter(app => app.status === 'COMPLETED').length,
      totalEarnings: applications
        .filter(app => app.status === 'COMPLETED')
        .reduce((sum, app) => sum + parseFloat(app.bronzeTask.payAmount), 0),
      pendingEarnings: applications
        .filter(app => app.status === 'ACCEPTED')
        .reduce((sum, app) => sum + parseFloat(app.bronzeTask.payAmount), 0),
      averageTaskValue: applications.length > 0 
        ? applications.reduce((sum, app) => sum + parseFloat(app.bronzeTask.payAmount), 0) / applications.length
        : 0
    };

    // Separate completed and active applications
    const completedApplications = applications.filter(app => app.status === 'COMPLETED');
    const activeApplications = applications.filter(app => app.status !== 'COMPLETED');

    // Format applications for dashboard
    const formattedApplications = applications.map(app => ({
      id: app.id,
      status: app.status,
      appliedAt: app.appliedAt,
      task: {
        id: app.bronzeTask.id,
        title: app.bronzeTask.title,
        category: app.bronzeTask.category,
        payAmount: parseFloat(app.bronzeTask.payAmount),
        duration: app.bronzeTask.duration,
        employer: {
          name: app.bronzeTask.employer.user.name,
          isVerified: app.bronzeTask.employer.isVerified
        }
      },
      payment: {
        status: app.bronzeTask.payments[0]?.status || 'PENDING',
        canReceive: app.status === 'COMPLETED',
        transactionId: app.bronzeTask.payments[0]?.transactionId,
        completedAt: app.bronzeTask.payments[0]?.completedAt
      },
      whatsappAvailable: app.status === 'ACCEPTED'
    }));

    // Format completed tasks with additional details
    const formattedCompletedTasks = completedApplications.map(app => ({
      id: app.id,
      taskId: app.bronzeTask.id,
      title: app.bronzeTask.title,
      category: app.bronzeTask.category,
      payAmount: parseFloat(app.bronzeTask.payAmount),
      duration: app.bronzeTask.duration,
      appliedAt: app.appliedAt,
      employer: {
        name: app.bronzeTask.employer.user.name,
        isVerified: app.bronzeTask.employer.isVerified
      },
      payment: {
        status: app.bronzeTask.payments[0]?.status || 'PENDING',
        transactionId: app.bronzeTask.payments[0]?.transactionId,
        completedAt: app.bronzeTask.payments[0]?.completedAt,
        amount: parseFloat(app.bronzeTask.payAmount)
      }
    }));

    console.log('✅ Worker dashboard data compiled');

    return res.json({
      success: true,
      data: {
        stats,
        applications: formattedApplications,
        completedTasks: formattedCompletedTasks.sort((a, b) => 
          new Date(b.payment.completedAt || b.appliedAt) - new Date(a.payment.completedAt || a.appliedAt)
        )
      }
    });

  } catch (error) {
    console.error('❌ Get worker dashboard error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch dashboard data'
    });
  }
});

// 🆕 WEBHOOK ENDPOINTS (FOR FUTURE WHATSAPP INTEGRATION)

/**
 * @route   POST /api/bronze-tasks/webhooks/whatsapp
 * @desc    Handle WhatsApp webhook events
 * @access  Public (webhook)
 */
router.post('/webhooks/whatsapp', async (req, res) => {
  try {
    const { event, taskId, message, sender } = req.body;

    console.log('📱 WhatsApp webhook received:', { event, taskId, sender });

    // Handle different webhook events
    switch (event) {
      case 'message_received':
        // Log message for task communication
        console.log(`Message in task ${taskId} from ${sender}: ${message}`);
        break;
        
      case 'file_uploaded':
        // Handle file uploads via WhatsApp
        console.log(`File uploaded in task ${taskId} from ${sender}`);
        break;
        
      case 'task_submitted':
        // Worker indicates task is complete
        console.log(`Task ${taskId} submitted by worker`);
        break;
        
      default:
        console.log(`Unknown WhatsApp event: ${event}`);
    }

    return res.json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('❌ WhatsApp webhook error:', error);
    return res.status(500).json({
      success: false,
      error: 'Webhook processing failed'
    });
  }
});

/**
 * @route   GET /api/bronze-tasks/health
 * @desc    Health check for bronze task system
 * @access  Public
 */
router.get('/health', async (req, res) => {
  try {
    // Check database connectivity
    const taskCount = await prisma.bronzeTask.count();
    const applicationCount = await prisma.bronzeTaskApplication.count();
    const paymentCount = await prisma.payment.count();

    return res.json({
      success: true,
      data: {
        status: 'healthy',
        database: 'connected',
        statistics: {
          totalTasks: taskCount,
          totalApplications: applicationCount,
          totalPayments: paymentCount
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Health check failed:', error);
    return res.status(500).json({
      success: false,
      data: {
        status: 'unhealthy',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
});

// ===================================
// CHAT ROUTES - ENCRYPTED MESSAGING
// ===================================

/**
 * Chat routes for task collaboration
 * All routes under /:taskId/chat
 */
router.use('/:taskId/chat', chatRoutes);

module.exports = router;