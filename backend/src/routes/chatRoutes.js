/**
 * Chat Routes - Encrypted messaging for task collaboration
 * Routes: /api/tasks/:taskId/chat/*
 */

const express = require('express');
const router = express.Router({ mergeParams: true }); // Allow access to taskId param
const { body } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/validation');
const chatController = require('../controllers/chatController');

/**
 * @route   GET /api/tasks/:taskId/chat
 * @desc    Get or create chat for a task
 * @access  Protected (Employer + Accepted Worker only)
 */
router.get('/', 
  authMiddleware.authenticateToken,
  chatController.getTaskChat
);

/**
 * @route   POST /api/tasks/:taskId/chat/messages
 * @desc    Send a message in task chat
 * @access  Protected (Chat participants only)
 */
router.post('/messages',
  [
    body('content')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('Message content must be between 1 and 1000 characters'),
    body('messageType')
      .optional()
      .isIn(['text', 'file', 'system'])
      .withMessage('Invalid message type')
  ],
  handleValidationErrors,
  authMiddleware.authenticateToken,
  chatController.sendChatMessage
);

/**
 * @route   PUT /api/tasks/:taskId/chat/read
 * @desc    Mark messages as read
 * @access  Protected (Chat participants only)
 */
router.put('/read',
  authMiddleware.authenticateToken,
  chatController.markMessagesAsRead
);

module.exports = router;