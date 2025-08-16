/**
 * Task Submission Controller
 * Handles worker submissions for accepted tasks
 * Supports file uploads, text content, links, and mixed submissions
 */

const { prisma } = require('../config/database');

/**
 * 🆕 NEW: Submit work for an accepted task
 * POST /api/task-submissions/:applicationId
 */
const createTaskSubmission = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const {
      submissionType = 'mixed', // 'file', 'text', 'link', 'mixed'
      textContent = '',
      links = [],
      fileDescriptions = []
    } = req.body;

    console.log('📝 Creating task submission:', { applicationId, submissionType });

    // Validate application and ensure it's accepted
    const application = await prisma.bronzeTaskApplication.findUnique({
      where: { id: applicationId },
      include: {
        bronzeTask: {
          include: {
            employer: { include: { user: { select: { name: true } } } }
          }
        },
        worker: { include: { user: { select: { name: true } } } },
        submission: true // Check if submission already exists
      }
    });

    if (!application) {
      // Cleanup uploaded files if validation fails
      if (req.submissionInfo && req.submissionInfo.length > 0) {
        const { cleanupFiles } = require('../middleware/taskFileUpload');
        cleanupFiles(req.files);
      }
      
      return res.status(404).json({
        success: false,
        error: 'Application not found',
        message: 'Invalid application ID'
      });
    }

    if (application.status !== 'ACCEPTED') {
      // Cleanup uploaded files
      if (req.submissionInfo && req.submissionInfo.length > 0) {
        const { cleanupFiles } = require('../middleware/taskFileUpload');
        cleanupFiles(req.files);
      }
      
      return res.status(400).json({
        success: false,
        error: 'Application not accepted',
        message: 'Can only submit work for accepted applications'
      });
    }

    // Parse links if provided as string
    const parsedLinks = Array.isArray(links) ? links : 
      (typeof links === 'string' && links.length > 0 ? links.split(',').map(link => link.trim()) : []);

    // Parse file descriptions if provided as string
    const parsedFileDescriptions = Array.isArray(fileDescriptions) ? fileDescriptions :
      (typeof fileDescriptions === 'string' && fileDescriptions.length > 0 ? 
        fileDescriptions.split(',').map(desc => desc.trim()) : []);

    // Prepare submission data
    const submissionData = {
      links: parsedLinks,
      metadata: {
        hasFiles: req.submissionInfo ? req.submissionInfo.length > 0 : false,
        hasText: textContent && textContent.length > 0,
        hasLinks: parsedLinks.length > 0,
        submittedFromIP: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown'
      }
    };

    let submission;
    let submissionFiles = [];

    // Check if this is an update to existing submission
    if (application.submission) {
      // Update existing submission
      submission = await prisma.taskSubmission.update({
        where: { id: application.submission.id },
        data: {
          submissionType,
          textContent: textContent || null,
          submissionData,
          status: 'SUBMITTED',
          version: { increment: 1 },
          isLatest: true,
          previousVersionId: application.submission.id
        }
      });

      console.log('✅ Updated existing submission:', submission.id);
    } else {
      // Create new submission
      submission = await prisma.taskSubmission.create({
        data: {
          taskId: application.bronzeTaskId,
          workerId: application.workerId,
          applicationId: applicationId,
          submissionType,
          textContent: textContent || null,
          submissionData,
          status: 'SUBMITTED',
          version: 1,
          isLatest: true
        }
      });

      console.log('✅ Created new submission:', submission.id);
    }

    // Handle file uploads if present
    if (req.submissionInfo && req.submissionInfo.length > 0) {
      try {
        const filePromises = req.submissionInfo.map((fileInfo, index) => {
          return prisma.taskSubmissionFile.create({
            data: {
              submissionId: submission.id,
              fileName: fileInfo.originalName,
              filePath: fileInfo.filePath,
              fileSize: fileInfo.fileSize,
              mimeType: fileInfo.mimeType,
              fileType: fileInfo.fileType,
              description: parsedFileDescriptions[index] || `File ${index + 1}`
            }
          });
        });

        submissionFiles = await Promise.all(filePromises);
        console.log(`✅ ${submissionFiles.length} submission files saved`);
        
      } catch (fileError) {
        console.error('❌ Failed to save submission files:', fileError);
        // Don't fail the submission, but cleanup files
        const { cleanupFiles } = require('../middleware/taskFileUpload');
        cleanupFiles(req.files);
        
        return res.status(500).json({
          success: false,
          error: 'File processing error',
          message: 'Submission created but file processing failed'
        });
      }
    }

    // Get complete submission data for response
    const completeSubmission = await prisma.taskSubmission.findUnique({
      where: { id: submission.id },
      include: {
        files: true,
        task: { select: { title: true, payAmount: true } },
        worker: { include: { user: { select: { name: true } } } }
      }
    });

    console.log('✅ Task submission completed successfully');

    return res.status(201).json({
      success: true,
      message: 'Work submitted successfully',
      data: {
        submission: {
          id: completeSubmission.id,
          status: completeSubmission.status,
          submissionType: completeSubmission.submissionType,
          textContent: completeSubmission.textContent,
          submissionData: completeSubmission.submissionData,
          version: completeSubmission.version,
          submittedAt: completeSubmission.submittedAt,
          files: completeSubmission.files.map(file => ({
            id: file.id,
            fileName: file.fileName,
            fileType: file.fileType,
            fileSize: file.fileSize,
            description: file.description,
            uploadedAt: file.uploadedAt
          }))
        },
        task: {
          title: completeSubmission.task.title,
          payAmount: parseFloat(completeSubmission.task.payAmount)
        },
        worker: {
          name: completeSubmission.worker.user.name
        }
      }
    });

  } catch (error) {
    console.error('❌ Create task submission error:', error);
    
    // Cleanup uploaded files on error
    if (req.submissionInfo && req.submissionInfo.length > 0) {
      const { cleanupFiles } = require('../middleware/taskFileUpload');
      cleanupFiles(req.files);
    }
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to create submission'
    });
  }
};

/**
 * 🆕 NEW: Get submission details
 * GET /api/task-submissions/:submissionId
 */
const getTaskSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { userId } = req.query; // For access control

    console.log('📋 Getting task submission:', { submissionId, userId });

    const submission = await prisma.taskSubmission.findUnique({
      where: { id: submissionId },
      include: {
        files: {
          orderBy: { uploadedAt: 'desc' }
        },
        task: {
          include: {
            employer: { include: { user: { select: { id: true, name: true } } } }
          }
        },
        worker: { include: { user: { select: { id: true, name: true } } } },
        application: true
      }
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found',
        message: 'Invalid submission ID'
      });
    }

    // Check access permissions
    let hasAccess = false;
    if (userId) {
      hasAccess = submission.worker.user.id === userId || submission.task.employer.user.id === userId;
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to view this submission'
      });
    }

    const submissionData = {
      id: submission.id,
      status: submission.status,
      submissionType: submission.submissionType,
      textContent: submission.textContent,
      submissionData: submission.submissionData,
      version: submission.version,
      isLatest: submission.isLatest,
      submittedAt: submission.submittedAt,
      reviewedAt: submission.reviewedAt,
      reviewNote: submission.reviewNote,
      
      files: submission.files.map(file => ({
        id: file.id,
        fileName: file.fileName,
        fileType: file.fileType,
        fileSize: file.fileSize,
        description: file.description,
        uploadedAt: file.uploadedAt
      })),

      task: {
        id: submission.task.id,
        title: submission.task.title,
        payAmount: parseFloat(submission.task.payAmount),
        employer: {
          name: submission.task.employer.user.name
        }
      },

      worker: {
        id: submission.worker.id,
        name: submission.worker.user.name
      },

      application: {
        id: submission.application.id,
        status: submission.application.status
      }
    };

    console.log('✅ Submission details retrieved');

    return res.json({
      success: true,
      data: {
        submission: submissionData
      }
    });

  } catch (error) {
    console.error('❌ Get task submission error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch submission'
    });
  }
};

/**
 * 🆕 NEW: Review submission (Employer only)
 * PUT /api/task-submissions/:submissionId/review
 */
const reviewTaskSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { status, reviewNote = '' } = req.body;
    const { userId } = req.query; // Employer's user ID

    console.log('📝 Reviewing task submission:', { submissionId, status });

    // Validate status
    const validStatuses = ['UNDER_REVIEW', 'REVISION_REQUESTED', 'APPROVED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const submission = await prisma.taskSubmission.findUnique({
      where: { id: submissionId },
      include: {
        task: {
          include: {
            employer: { include: { user: { select: { id: true, name: true } } } }
          }
        },
        worker: { include: { user: { select: { name: true } } } },
        application: true
      }
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found',
        message: 'Invalid submission ID'
      });
    }

    // Check if user is the employer (handle both User ID and Employer ID)
    const isEmployer = submission.task.employer.user.id === userId || submission.task.employer.id === userId;
    
    console.log('🔍 DEBUG - Employer authorization check:', {
      userId: userId,
      employerUserId: submission.task.employer.user.id,
      employerId: submission.task.employer.id,
      isEmployer: isEmployer,
      matchedBy: submission.task.employer.user.id === userId ? 'user.id' : 
                submission.task.employer.id === userId ? 'employer.id' : 'none'
    });
    
    if (!isEmployer) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only the employer can review submissions'
      });
    }

    // Update submission status
    const updatedSubmission = await prisma.taskSubmission.update({
      where: { id: submissionId },
      data: {
        status,
        reviewNote: reviewNote || null,
        reviewedAt: new Date()
      }
    });

    // If approved, mark application as completed
    if (status === 'APPROVED') {
      await prisma.bronzeTaskApplication.update({
        where: { id: submission.applicationId },
        data: { status: 'COMPLETED' }
      });

      // Release payment (using existing function)
      try {
        const bronzeTaskController = require('./bronzeTaskController');
        await releasePaymentToWorker(
          submission.taskId,
          submission.workerId,
          submission.worker.upiId || `${submission.worker.user.phone}@paytm`
        );

        console.log('✅ Payment released after approval');
      } catch (paymentError) {
        console.error('❌ Payment release failed:', paymentError);
        // Don't fail the approval, but log the error
      }

      // Cleanup chat messages and submission files to save storage space
      try {
        const chatController = require('./chatController');
        const cleanupResult = await chatController.cleanupTaskData(submission.taskId);
        console.log('✅ Task data cleanup completed:', cleanupResult);
      } catch (cleanupError) {
        console.error('❌ Task cleanup failed:', cleanupError);
        // Don't fail the approval, but log the error
      }
    }

    console.log('✅ Submission reviewed successfully');

    return res.json({
      success: true,
      message: `Submission ${status.toLowerCase().replace('_', ' ')} successfully`,
      data: {
        submission: {
          id: updatedSubmission.id,
          status: updatedSubmission.status,
          reviewNote: updatedSubmission.reviewNote,
          reviewedAt: updatedSubmission.reviewedAt
        },
        task: {
          title: submission.task.title
        },
        worker: {
          name: submission.worker.user.name
        }
      }
    });

  } catch (error) {
    console.error('❌ Review task submission error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to review submission'
    });
  }
};

/**
 * 🆕 NEW: Download submission file
 * GET /api/task-submissions/:submissionId/files/:fileId/download
 */
const downloadSubmissionFile = async (req, res) => {
  try {
    const { submissionId, fileId } = req.params;
    const { userId } = req.query; // For access control

    console.log('📎 Downloading submission file:', { submissionId, fileId });

    // Get file details with access control
    const file = await prisma.taskSubmissionFile.findFirst({
      where: { 
        id: fileId,
        submissionId: submissionId 
      },
      include: {
        submission: {
          include: {
            task: {
              include: {
                employer: { include: { user: { select: { id: true } } } }
              }
            },
            worker: { include: { user: { select: { id: true } } } }
          }
        }
      }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found',
        message: 'Invalid file ID'
      });
    }

    // Check access permissions
    let hasAccess = false;
    if (userId) {
      hasAccess = file.submission.worker.user.id === userId || 
                  file.submission.task.employer.user.id === userId;
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to download this file'
      });
    }

    // Serve the file
    const { serveFile } = require('../middleware/taskFileUpload');
    serveFile(file.filePath, file.fileName, res);

  } catch (error) {
    console.error('❌ Download submission file error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to download file'
    });
  }
};

/**
 * 🆕 NEW: Get submissions for a task (Employer view)
 * GET /api/tasks/:taskId/submissions
 */
const getTaskSubmissions = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId, status } = req.query;

    console.log('📋 Getting task submissions:', { taskId, status });

    // Verify task exists and user is employer
    const task = await prisma.bronzeTask.findUnique({
      where: { id: taskId },
      include: {
        employer: { include: { user: { select: { id: true, name: true } } } }
      }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
        message: 'Invalid task ID'
      });
    }

    if (task.employer.user.id !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only the employer can view task submissions'
      });
    }

    // Build where clause
    const where = { taskId };
    if (status) {
      where.status = status.toUpperCase();
    }

    const submissions = await prisma.taskSubmission.findMany({
      where,
      include: {
        files: true,
        worker: { include: { user: { select: { name: true } } } },
        application: { select: { id: true, status: true } }
      },
      orderBy: { submittedAt: 'desc' }
    });

    const formattedSubmissions = submissions.map(sub => ({
      id: sub.id,
      status: sub.status,
      submissionType: sub.submissionType,
      textContent: sub.textContent,
      submissionData: sub.submissionData,
      version: sub.version,
      submittedAt: sub.submittedAt,
      reviewedAt: sub.reviewedAt,
      reviewNote: sub.reviewNote,
      
      files: sub.files.map(file => ({
        id: file.id,
        fileName: file.fileName,
        fileType: file.fileType,
        fileSize: file.fileSize,
        description: file.description,
        uploadedAt: file.uploadedAt
      })),

      worker: {
        id: sub.worker.id,
        name: sub.worker.user.name
      },

      application: {
        id: sub.application.id,
        status: sub.application.status
      }
    }));

    console.log(`✅ Found ${submissions.length} submissions for task`);

    return res.json({
      success: true,
      data: {
        submissions: formattedSubmissions,
        task: {
          id: task.id,
          title: task.title,
          employer: task.employer.user.name
        }
      }
    });

  } catch (error) {
    console.error('❌ Get task submissions error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to fetch submissions'
    });
  }
};

// Helper function (referenced from bronze task controller)
async function releasePaymentToWorker(taskId, workerId, workerUpiId, rating = 5, feedback = '') {
  try {
    console.log('💸 Releasing payment to worker:', { taskId, workerId, workerUpiId });

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

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        workerId,
        workerUpiId: workerUpiId.toLowerCase(),
        status: 'COMPLETED',
        completedAt: new Date(),
        transactionId: generateTransactionId(),
        paymentNote: `Payment released after submission approval - Rating: ${rating}/5`
      }
    });

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

function generateTransactionId() {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `TXN${timestamp.slice(-6)}${random}`;
}

module.exports = {
  createTaskSubmission,
  getTaskSubmission,
  reviewTaskSubmission,
  downloadSubmissionFile,
  getTaskSubmissions
};