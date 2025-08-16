const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { authenticateToken, requireEmployer, requireWorker } = require('../middleware/auth');

// Import the payment controller
const paymentController = require('../controllers/paymentController');

const router = express.Router();

/**
 * Payment Routes - Fake UPI Integration for Hackathon Demo
 * 
 * Endpoints:
 * - POST /setup-mandate - Setup UPI mandate for employer
 * - POST /escrow - Lock payment in escrow
 * - POST /release - Release payment to worker
 * - GET /history/:employerId - Get payment history
 * - GET /status/:taskId - Get payment status for task
 * - GET /mandates/:employerId - Get employer mandates
 * - GET /banks - Get Indian banks list
 */

/**
 * Validation middleware
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ Payment validation errors:', errors.array());
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * Setup UPI mandate for employer
 * POST /api/payments/setup-mandate
 */
router.post('/setup-mandate',
  authenticateToken,
  requireEmployer,
  [
    body('employerId').isString().withMessage('Employer ID is required'),
    body('upiId')
      .isString()
      .withMessage('UPI ID is required')
      .matches(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/)
      .withMessage('Invalid UPI ID format (e.g., employer@paytm)'),
    body('bankName').isString().withMessage('Bank name is required'),
    body('maxAmount')
      .optional()
      .isFloat({ min: 1000, max: 500000 })
      .withMessage('Max amount must be between ₹1,000 and ₹5,00,000')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      console.log('📡 POST /api/payments/setup-mandate');
      await paymentController.setupUPIMandate(req, res);
    } catch (error) {
      console.error('❌ Setup mandate route error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to setup UPI mandate'
      });
    }
  }
);

/**
 * Lock payment in escrow
 * POST /api/payments/escrow
 */
router.post('/escrow',
  authenticateToken,
  requireEmployer,
  [
    body('taskId').isString().withMessage('Task ID is required'),
    body('employerId').isString().withMessage('Employer ID is required'),
    body('amount')
      .isFloat({ min: 100, max: 100000 })
      .withMessage('Amount must be between ₹100 and ₹1,00,000')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      console.log('📡 POST /api/payments/escrow');
      await paymentController.lockPaymentInEscrow(req, res);
    } catch (error) {
      console.error('❌ Escrow route error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to lock payment in escrow'
      });
    }
  }
);

/**
 * Release payment to worker
 * POST /api/payments/release
 */
router.post('/release',
  authenticateToken,
  requireEmployer,
  [
    body('taskId').isString().withMessage('Task ID is required'),
    body('workerId').isString().withMessage('Worker ID is required'),
    body('workerUpiId')
      .isString()
      .withMessage('Worker UPI ID is required')
      .matches(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/)
      .withMessage('Invalid worker UPI ID format')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      console.log('📡 POST /api/payments/release');
      await paymentController.releasePaymentToWorker(req, res);
    } catch (error) {
      console.error('❌ Release payment route error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to release payment'
      });
    }
  }
);

/**
 * Get payment history for employer
 * GET /api/payments/history/:employerId
 */
router.get('/history/:employerId',
  [
    param('employerId').isString().withMessage('Employer ID is required'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be positive'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['PENDING', 'ESCROWED', 'COMPLETED', 'FAILED', 'REFUNDED']).withMessage('Invalid status')
  ],
  handleValidationErrors,
  authenticateToken,
  requireEmployer,
  async (req, res) => {
    try {
      console.log('📡 GET /api/payments/history/:employerId');
      
      // Verify employer is accessing their own history
      if (req.employerId !== req.params.employerId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You can only access your own payment history'
        });
      }
      
      await paymentController.getPaymentHistory(req, res);
    } catch (error) {
      console.error('❌ Payment history route error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch payment history'
      });
    }
  }
);

/**
 * Get payment status for task
 * GET /api/payments/status/:taskId
 */
router.get('/status/:taskId',
  [
    param('taskId').isString().withMessage('Task ID is required')
  ],
  handleValidationErrors,
  authenticateToken, // Both employers and workers can check status
  async (req, res) => {
    try {
      console.log('📡 GET /api/payments/status/:taskId');
      await paymentController.getPaymentStatus(req, res);
    } catch (error) {
      console.error('❌ Payment status route error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch payment status'
      });
    }
  }
);

/**
 * Get employer's UPI mandates
 * GET /api/payments/mandates/:employerId
 */
router.get('/mandates/:employerId',
  [
    param('employerId').isString().withMessage('Employer ID is required')
  ],
  handleValidationErrors,
  authenticateToken,
  requireEmployer,
  async (req, res) => {
    try {
      console.log('📡 GET /api/payments/mandates/:employerId');
      
      // Verify employer is accessing their own mandates
      if (req.employerId !== req.params.employerId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You can only access your own UPI mandates'
        });
      }
      
      await paymentController.getEmployerMandates(req, res);
    } catch (error) {
      console.error('❌ Get mandates route error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch UPI mandates'
      });
    }
  }
);

/**
 * Get Indian banks list
 * GET /api/payments/banks
 */
router.get('/banks', async (req, res) => {
  try {
    console.log('📡 GET /api/payments/banks');
    await paymentController.getIndianBanks(req, res);
  } catch (error) {
    console.error('❌ Get banks route error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch banks list'
    });
  }
});

/**
 * Auto-escrow payment when task is created (called internally)
 * POST /api/payments/auto-escrow
 */
router.post('/auto-escrow',
  authenticateToken,
  requireEmployer,
  [
    body('taskId').isString().withMessage('Task ID is required'),
    body('amount').isFloat({ min: 100 }).withMessage('Amount must be at least ₹100')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      console.log('📡 POST /api/payments/auto-escrow (internal)');
      
      // Add employerId from auth
      req.body.employerId = req.employerId;
      
      await paymentController.lockPaymentInEscrow(req, res);
    } catch (error) {
      console.error('❌ Auto-escrow route error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to auto-escrow payment'
      });
    }
  }
);

/**
 * Refund payment (for cancelled tasks)
 * POST /api/payments/refund
 */
router.post('/refund',
  authenticateToken,
  requireEmployer,
  [
    body('taskId').isString().withMessage('Task ID is required'),
    body('reason').optional().isString().withMessage('Refund reason must be a string')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      console.log('📡 POST /api/payments/refund');
      
      // For now, return success (implement if needed)
      res.json({
        success: true,
        message: 'Refund processed successfully',
        data: {
          refundId: `REF${Date.now()}`,
          amount: 0,
          status: 'REFUNDED',
          processedAt: new Date()
        }
      });
      
    } catch (error) {
      console.error('❌ Refund route error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process refund'
      });
    }
  }
);

/**
 * Debug endpoint for payment system (development only)
 */
if (process.env.NODE_ENV === 'development') {
  router.get('/debug', async (req, res) => {
    try {
      const { prisma } = require('../config/database');
      
      // Get payment statistics
      const stats = await Promise.all([
        prisma.payment.count(),
        prisma.uPIMandate.count(),
        prisma.payment.count({ where: { status: 'ESCROWED' } }),
        prisma.payment.count({ where: { status: 'COMPLETED' } })
      ]);
      
      // Get recent payments
      const recentPayments = await prisma.payment.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          task: { select: { title: true } },
          employer: { include: { user: { select: { name: true } } } }
        }
      });
      
      res.json({
        success: true,
        debug: {
          database: {
            totalPayments: stats[0],
            totalMandates: stats[1],
            escrowedPayments: stats[2],
            completedPayments: stats[3]
          },
          recentPayments: recentPayments.map(payment => ({
            id: payment.id,
            amount: parseFloat(payment.amount),
            status: payment.status,
            taskTitle: payment.task.title,
            employerName: payment.employer.user.name,
            transactionId: payment.transactionId,
            createdAt: payment.createdAt
          })),
          banks: paymentController.constructor.getIndianBanks(),
          timestamp: new Date().toISOString()
        }
      });
      
    } catch (error) {
      console.error('❌ Payment debug error:', error);
      res.status(500).json({
        success: false,
        error: 'Debug failed',
        details: error.message
      });
    }
  });
}

module.exports = router;