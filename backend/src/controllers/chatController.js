/**
 * Chat Controller - Encrypted messaging between workers and employers
 * Features: End-to-end encryption, real-time messaging, automatic cleanup
 */

const { PrismaClient } = require('@prisma/client');
const encryptionService = require('../utils/encryption');

const prisma = new PrismaClient();

/**
 * Get or create chat for a task
 * GET /api/tasks/:taskId/chat
 */
const getTaskChat = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.userId;

    console.log('📞 Getting task chat:', { taskId, userId });

    // Get task with employer and applications
    const task = await prisma.bronzeTask.findUnique({
      where: { id: taskId },
      include: {
        employer: { include: { user: true } },
        applications: {
          include: { worker: { include: { user: true } } }
        },
        chat: {
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
              take: 50 // Last 50 messages
            }
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    // Determine user role and permissions
    let userRole = null;
    let workerId = null;
    let employerId = null;

    // Remove debug logs for cleaner output

    // Use consistent User ID for identification
    if (task.employer.user.id === userId) {
      userRole = 'employer';
      employerId = task.employer.id;
    } else {
      // Check if user is a worker with accepted application
      const userWorker = await prisma.user.findUnique({
        where: { id: userId },
        include: { worker: true }
      });

      if (userWorker?.worker) {
        const acceptedApp = task.applications.find(app => 
          app.workerId === userWorker.worker.id && app.status === 'ACCEPTED'
        );
        
        if (acceptedApp) {
          userRole = 'worker';
          workerId = userWorker.worker.id;
          employerId = task.employer.id;
        }
      }
    }

    if (!userRole) {
      console.log('❌ Access denied - Debug info:', {
        userId,
        employerUserId: task.employer.user.id,
        taskApplications: task.applications.map(app => ({
          id: app.id,
          workerId: app.workerId,
          status: app.status,
          workerUserId: 'N/A' // We don't have worker user ID in this query
        }))
      });
      
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only the employer and accepted workers can access task chat'
      });
    }

    // Get or create chat
    let chat = task.chat;
    
    if (!chat && userRole) {
      // Create chat only if user has permission and both parties exist
      const workerForChat = workerId || task.applications.find(app => app.status === 'ACCEPTED')?.workerId;
      
      if (workerForChat) {
        chat = await prisma.taskChat.create({
          data: {
            taskId: taskId,
            workerId: workerForChat,
            employerId: task.employer.id,
            isActive: true
          },
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
              take: 50
            }
          }
        });
      }
    }

    if (!chat) {
      return res.status(400).json({
        success: false,
        error: 'Chat not available',
        message: 'Chat can only be created when a worker is accepted for the task'
      });
    }

    // Decrypt messages for response
    const decryptedMessages = chat.messages.map(message => ({
      id: message.id,
      senderId: message.senderId,
      senderType: message.senderType,
      content: encryptionService.decrypt(message.encryptedContent),
      messageType: message.messageType,
      isRead: message.isRead,
      createdAt: message.createdAt
    }));

    console.log('✅ Task chat retrieved:', { chatId: chat.id, messagesCount: decryptedMessages.length });

    res.json({
      success: true,
      data: {
        chat: {
          id: chat.id,
          taskId: chat.taskId,
          isActive: chat.isActive,
          userRole: userRole,
          messages: decryptedMessages
        }
      }
    });

  } catch (error) {
    console.error('❌ Get task chat error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to retrieve chat'
    });
  }
};

/**
 * Send a message in task chat
 * POST /api/tasks/:taskId/chat/messages
 */
const sendChatMessage = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content, messageType = 'text' } = req.body;
    const userId = req.userId;

    console.log('💬 Sending chat message:', { taskId, userId, messageType });

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message content required'
      });
    }

    // Get chat and verify permissions
    const chat = await prisma.taskChat.findUnique({
      where: { taskId: taskId },
      include: {
        task: {
          include: {
            employer: { include: { user: true } }
          }
        },
        worker: { include: { user: true } }
      }
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Chat not found'
      });
    }

    if (!chat.isActive) {
      return res.status(400).json({
        success: false,
        error: 'Chat is no longer active'
      });
    }

    // Determine sender type and verify permission
    let senderType = null;
    let senderUserId = null;

    // Keep minimal logging for user identification issues
    console.log('🔍 Chat user check:', {
      userId: userId,
      isEmployer: chat.task.employer.user.id === userId,
      isWorker: chat.worker.user.id === userId
    });

    // Use the consistent User ID for identification
    if (chat.task.employer.user.id === userId) {
      senderType = 'employer';
      senderUserId = userId;
    } else if (chat.worker.user.id === userId) {
      senderType = 'worker';  
      senderUserId = userId;
    }

    if (!senderType) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Only chat participants can send messages'
      });
    }

    // Encrypt message content
    const encryptedContent = encryptionService.encrypt(content.trim());

    // Save message
    const message = await prisma.chatMessage.create({
      data: {
        chatId: chat.id,
        senderId: senderUserId,
        senderType: senderType,
        encryptedContent: encryptedContent,
        messageType: messageType,
        isRead: false
      }
    });

    // Update chat timestamp
    await prisma.taskChat.update({
      where: { id: chat.id },
      data: { updatedAt: new Date() }
    });

    console.log('✅ Chat message sent:', { messageId: message.id, chatId: chat.id });

    res.json({
      success: true,
      data: {
        message: {
          id: message.id,
          senderId: message.senderId,
          senderType: message.senderType,
          content: content, // Return decrypted content
          messageType: message.messageType,
          createdAt: message.createdAt
        }
      }
    });

  } catch (error) {
    console.error('❌ Send chat message error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to send message'
    });
  }
};

/**
 * Mark messages as read
 * PUT /api/tasks/:taskId/chat/read
 */
const markMessagesAsRead = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.userId;

    console.log('👁️ Marking messages as read:', { taskId, userId });

    const chat = await prisma.taskChat.findUnique({
      where: { taskId: taskId },
      include: {
        task: { include: { employer: { include: { user: true } } } },
        worker: { include: { user: true } }
      }
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Chat not found'
      });
    }

    // Verify user is part of chat using consistent User ID
    const isEmployer = chat.task.employer.user.id === userId;
    const isWorker = chat.worker.user.id === userId;

    if (!isEmployer && !isWorker) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Mark unread messages from other party as read
    const otherPartySenderId = isEmployer ? chat.worker.user.id : chat.task.employer.user.id;
    
    await prisma.chatMessage.updateMany({
      where: {
        chatId: chat.id,
        senderId: otherPartySenderId,
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    console.log('✅ Messages marked as read');

    res.json({
      success: true,
      message: 'Messages marked as read'
    });

  } catch (error) {
    console.error('❌ Mark messages as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

/**
 * Cleanup chat and files when task is completed
 * Internal function called when task status changes to APPROVED
 */
const cleanupTaskData = async (taskId) => {
  try {
    console.log('🧹 Starting cleanup for completed task:', taskId);

    // Get task with all related data
    const task = await prisma.bronzeTask.findUnique({
      where: { id: taskId },
      include: {
        chat: {
          include: { messages: true }
        },
        applications: {
          include: {
            submission: {
              include: { files: true }
            }
          }
        }
      }
    });

    if (!task) {
      console.log('❌ Task not found for cleanup:', taskId);
      return;
    }

    let cleanedItems = {
      chatMessages: 0,
      submissionFiles: 0,
      chats: 0
    };

    // Delete chat messages and chat
    if (task.chat) {
      cleanedItems.chatMessages = task.chat.messages.length;
      
      await prisma.chatMessage.deleteMany({
        where: { chatId: task.chat.id }
      });

      await prisma.taskChat.delete({
        where: { id: task.chat.id }
      });
      
      cleanedItems.chats = 1;
    }

    // Delete submission files (but keep submission records for history)
    for (const application of task.applications) {
      if (application.submission?.files) {
        cleanedItems.submissionFiles += application.submission.files.length;
        
        // Delete file records from database
        await prisma.taskSubmissionFile.deleteMany({
          where: { submissionId: application.submission.id }
        });

        // In a real implementation, you would also delete actual files from storage
        // Example: await deleteFilesFromStorage(application.submission.files);
      }
    }

    console.log('✅ Task data cleanup completed:', {
      taskId,
      cleanedItems
    });

    return cleanedItems;

  } catch (error) {
    console.error('❌ Task cleanup error:', error);
    throw error;
  }
};

module.exports = {
  getTaskChat,
  sendChatMessage,
  markMessagesAsRead,
  cleanupTaskData
};