const { v4: uuidv4 } = require('uuid');
const { prisma, withTransaction } = require('../config/database');

/**
 * Payment Controller - Fake UPI Integration for Hackathon Demo
 * Simulates realistic UPI payment flow with Indian banks and UPI IDs
 * 
 * Features:
 * - UPI mandate setup with real bank names
 * - Escrow system with payment locking
 * - Instant transfer simulation with realistic delays
 * - Transaction history and status tracking
 * - Indian payment ecosystem simulation
 */

class PaymentController {

  /**
   * Setup UPI mandate for employer
   * POST /api/payments/setup-mandate
   */
  async setupUPIMandate(req, res) {
    try {
      const { employerId, upiId, bankName, maxAmount = 50000 } = req.body;
      
      console.log('💳 Setting up UPI mandate:', { employerId, upiId, bankName });
      
      // Validate UPI ID format (basic simulation)
      if (!this.isValidUPIId(upiId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid UPI ID',
          message: 'Please enter a valid UPI ID (e.g., employer@paytm)'
        });
      }

      // Simulate UPI verification delay
      await this.simulateDelay(2000);

      // Check if mandate already exists
      const existingMandate = await prisma.uPIMandate.findFirst({
        where: { employerId, status: 'ACTIVE' }
      });

      if (existingMandate) {
        return res.status(409).json({
          success: false,
          error: 'Mandate exists',
          message: 'You already have an active UPI mandate'
        });
      }

      // Create UPI mandate
      const mandate = await prisma.uPIMandate.create({
        data: {
          employerId,
          upiId: upiId.toLowerCase(),
          bankName,
          accountLast4: this.generateAccountLast4(),
          mandateRef: this.generateMandateRef(),
          maxAmount: parseFloat(maxAmount),
          dailyLimit: Math.min(parseFloat(maxAmount), 10000),
          monthlyLimit: parseFloat(maxAmount),
          status: 'ACTIVE',
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          isVerified: true,
          verifiedAt: new Date()
        }
      });

      console.log('✅ UPI mandate created:', mandate.mandateRef);

      res.status(201).json({
        success: true,
        message: 'UPI mandate setup successful! You can now post tasks with payment protection.',
        data: {
          mandate: {
            id: mandate.id,
            mandateRef: mandate.mandateRef,
            upiId: mandate.upiId,
            bankName: mandate.bankName,
            accountLast4: mandate.accountLast4,
            maxAmount: parseFloat(mandate.maxAmount),
            validUntil: mandate.validUntil,
            status: mandate.status
          }
        }
      });

    } catch (error) {
      console.error('❌ UPI mandate setup error:', error);
      res.status(500).json({
        success: false,
        error: 'Mandate setup failed',
        message: 'Failed to setup UPI mandate. Please try again.'
      });
    }
  }

  /**
   * Lock payment in escrow when task is posted
   * POST /api/payments/escrow
   */
  async lockPaymentInEscrow(req, res) {
    try {
      const { taskId, employerId, amount } = req.body;
      
      console.log('🔒 Locking payment in escrow:', { taskId, employerId, amount });

      // Get employer's active mandate
      const mandate = await prisma.uPIMandate.findFirst({
        where: { 
          employerId, 
          status: 'ACTIVE',
          validUntil: { gt: new Date() }
        }
      });

      if (!mandate) {
        return res.status(400).json({
          success: false,
          error: 'No active mandate',
          message: 'Please setup UPI mandate first'
        });
      }

      // Check mandate limits
      if (parseFloat(amount) > parseFloat(mandate.maxAmount)) {
        return res.status(400).json({
          success: false,
          error: 'Amount exceeds limit',
          message: `Amount exceeds your mandate limit of ₹${mandate.maxAmount}`
        });
      }

      // Simulate bank processing delay
      await this.simulateDelay(3000);

      // Create payment record in escrow
      const payment = await prisma.payment.create({
        data: {
          taskId,
          employerId,
          amount: parseFloat(amount),
          status: 'ESCROWED',
          mandateId: mandate.mandateRef,
          upiId: mandate.upiId,
          escrowedAt: new Date(),
          escrowMethod: 'UPI',
          bankName: mandate.bankName,
          transactionId: this.generateTransactionId(),
          paymentNote: `Task payment escrowed via ${mandate.bankName}`
        }
      });

      // Update task payment status
      await prisma.task.update({
        where: { id: taskId },
        data: { paymentLocked: true }
      });

      console.log('✅ Payment escrowed:', payment.transactionId);

      res.json({
        success: true,
        message: `₹${amount} successfully locked in escrow! Workers can now apply confidently.`,
        data: {
          payment: {
            id: payment.id,
            transactionId: payment.transactionId,
            amount: parseFloat(payment.amount),
            status: payment.status,
            escrowedAt: payment.escrowedAt,
            bankName: payment.bankName
          }
        }
      });

    } catch (error) {
      console.error('❌ Escrow error:', error);
      res.status(500).json({
        success: false,
        error: 'Escrow failed',
        message: 'Failed to lock payment. Please try again.'
      });
    }
  }

  /**
   * Release payment to worker when task is completed
   * POST /api/payments/release
   */
  async releasePaymentToWorker(req, res) {
    try {
      const { taskId, workerId, workerUpiId } = req.body;
      
      console.log('💸 Releasing payment to worker:', { taskId, workerId, workerUpiId });

      // Get escrowed payment
      const payment = await prisma.payment.findFirst({
        where: { 
          taskId,
          status: 'ESCROWED'
        },
        include: {
          task: { include: { employer: { include: { user: true } } } },
          employer: { include: { user: true } }
        }
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          error: 'No escrowed payment',
          message: 'No escrowed payment found for this task'
        });
      }

      // Validate worker UPI ID
      if (!this.isValidUPIId(workerUpiId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid worker UPI ID',
          message: 'Please provide a valid UPI ID for payment'
        });
      }

      // Simulate payment processing
      await this.simulatePaymentProcessing();

      // Update payment and worker records in transaction
      const result = await withTransaction(async (prisma) => {
        // Update payment status
        const updatedPayment = await prisma.payment.update({
          where: { id: payment.id },
          data: {
            workerId,
            workerUpiId: workerUpiId.toLowerCase(),
            status: 'COMPLETED',
            completedAt: new Date(),
            transactionId: this.generateTransactionId(), // New transaction for release
            paymentNote: `Payment released to worker via UPI`
          }
        });

        // Update worker total earnings
        await prisma.worker.update({
          where: { id: workerId },
          data: {
            totalEarnings: { increment: parseFloat(payment.amount) },
            upiId: workerUpiId.toLowerCase() // Update worker's UPI ID
          }
        });

        // Update task status to completed
        await prisma.task.update({
          where: { id: taskId },
          data: { status: 'COMPLETED' }
        });

        return updatedPayment;
      });

      console.log('✅ Payment released successfully:', result.transactionId);

      res.json({
        success: true,
        message: `₹${payment.amount} transferred instantly to worker! 🎉`,
        data: {
          payment: {
            id: result.id,
            transactionId: result.transactionId,
            amount: parseFloat(result.amount),
            status: result.status,
            completedAt: result.completedAt,
            workerUpiId: result.workerUpiId
          },
          notification: {
            title: 'Payment Successful!',
            message: `₹${payment.amount} has been transferred to ${workerUpiId}`,
            type: 'success'
          }
        }
      });

    } catch (error) {
      console.error('❌ Payment release error:', error);
      res.status(500).json({
        success: false,
        error: 'Payment release failed',
        message: 'Failed to release payment. Please try again.'
      });
    }
  }

  /**
   * Get payment history for employer
   * GET /api/payments/history/:employerId
   */
  async getPaymentHistory(req, res) {
    try {
      const { employerId } = req.params;
      const { page = 1, limit = 20, status } = req.query;

      console.log('📊 Getting payment history for employer:', employerId);

      const where = { employerId };
      if (status) {
        where.status = status.toUpperCase();
      }

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where,
          include: {
            task: { select: { title: true, category: true } },
            worker: { include: { user: { select: { name: true } } } }
          },
          orderBy: { createdAt: 'desc' },
          skip: (parseInt(page) - 1) * parseInt(limit),
          take: parseInt(limit)
        }),
        prisma.payment.count({ where })
      ]);

      // Format payment history
      const formattedPayments = payments.map(payment => ({
        id: payment.id,
        transactionId: payment.transactionId,
        amount: parseFloat(payment.amount),
        status: payment.status,
        taskTitle: payment.task.title,
        taskCategory: payment.task.category,
        workerName: payment.worker?.user?.name || 'Not assigned',
        workerUpiId: payment.workerUpiId,
        bankName: payment.bankName,
        escrowedAt: payment.escrowedAt,
        completedAt: payment.completedAt,
        paymentNote: payment.paymentNote,
        createdAt: payment.createdAt
      }));

      res.json({
        success: true,
        data: {
          payments: formattedPayments,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalPayments: total,
            hasNext: parseInt(page) * parseInt(limit) < total,
            hasPrev: parseInt(page) > 1
          }
        }
      });

    } catch (error) {
      console.error('❌ Payment history error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch payment history'
      });
    }
  }

  /**
   * Get payment status for task
   * GET /api/payments/status/:taskId
   */
  async getPaymentStatus(req, res) {
    try {
      const { taskId } = req.params;

      const payment = await prisma.payment.findFirst({
        where: { taskId },
        include: {
          task: { select: { title: true, totalBudget: true } },
          employer: { include: { user: { select: { name: true } } } },
          worker: { include: { user: { select: { name: true } } } }
        }
      });

      if (!payment) {
        return res.status(404).json({
          success: false,
          error: 'Payment not found'
        });
      }

      res.json({
        success: true,
        data: {
          payment: {
            id: payment.id,
            status: payment.status,
            amount: parseFloat(payment.amount),
            transactionId: payment.transactionId,
            taskTitle: payment.task.title,
            employerName: payment.employer.user.name,
            workerName: payment.worker?.user?.name,
            escrowedAt: payment.escrowedAt,
            completedAt: payment.completedAt,
            bankName: payment.bankName,
            paymentNote: payment.paymentNote
          }
        }
      });

    } catch (error) {
      console.error('❌ Payment status error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch payment status'
      });
    }
  }

  /**
   * Get employer's UPI mandates
   * GET /api/payments/mandates/:employerId
   */
  async getEmployerMandates(req, res) {
    try {
      const { employerId } = req.params;

      const mandates = await prisma.uPIMandate.findMany({
        where: { employerId },
        orderBy: { createdAt: 'desc' }
      });

      const formattedMandates = mandates.map(mandate => ({
        id: mandate.id,
        mandateRef: mandate.mandateRef,
        upiId: mandate.upiId,
        bankName: mandate.bankName,
        accountLast4: mandate.accountLast4,
        maxAmount: parseFloat(mandate.maxAmount),
        status: mandate.status,
        validUntil: mandate.validUntil,
        createdAt: mandate.createdAt
      }));

      res.json({
        success: true,
        data: { mandates: formattedMandates }
      });

    } catch (error) {
      console.error('❌ Get mandates error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch mandates'
      });
    }
  }

  /**
   * Helper Methods for Realistic Simulation
   */

  // Validate UPI ID format
  isValidUPIId(upiId) {
    if (!upiId || typeof upiId !== 'string') return false;
    
    // Common UPI patterns: user@bank, phone@bank, email@bank
    const upiPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
    const validProviders = ['paytm', 'phonepe', 'googlepay', 'amazonpay', 'bhim', 'sbi', 'hdfc', 'icici', 'axis', 'kotak'];
    
    if (!upiPattern.test(upiId)) return false;
    
    const provider = upiId.split('@')[1].toLowerCase();
    return validProviders.some(validProvider => provider.includes(validProvider));
  }

  // Generate realistic account last 4 digits
  generateAccountLast4() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  // Generate UPI mandate reference
  generateMandateRef() {
    const prefix = 'UPI';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${timestamp}${random}`;
  }

  // Generate realistic transaction ID
  generateTransactionId() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TXN${timestamp.slice(-6)}${random}`;
  }

  // Simulate processing delays for realism
  async simulateDelay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Simulate realistic payment processing with multiple steps
  async simulatePaymentProcessing() {
    console.log('🔄 Processing payment...');
    
    // Step 1: Validate payment
    await this.simulateDelay(1000);
    console.log('✅ Payment validated');
    
    // Step 2: Debit from employer
    await this.simulateDelay(1500);
    console.log('✅ Amount debited from employer');
    
    // Step 3: Credit to worker
    await this.simulateDelay(1000);
    console.log('✅ Amount credited to worker');
    
    // Step 4: Send notifications
    await this.simulateDelay(500);
    console.log('✅ Notifications sent');
  }

  /**
   * Indian Banks Configuration for UPI
   */
  static getIndianBanks() {
    return [
      { code: 'SBI', name: 'State Bank of India', upiHandle: 'sbi' },
      { code: 'HDFC', name: 'HDFC Bank', upiHandle: 'hdfc' },
      { code: 'ICICI', name: 'ICICI Bank', upiHandle: 'icici' },
      { code: 'AXIS', name: 'Axis Bank', upiHandle: 'axis' },
      { code: 'KOTAK', name: 'Kotak Mahindra Bank', upiHandle: 'kotak' },
      { code: 'PNB', name: 'Punjab National Bank', upiHandle: 'pnb' },
      { code: 'BOB', name: 'Bank of Baroda', upiHandle: 'bob' },
      { code: 'CANARA', name: 'Canara Bank', upiHandle: 'canara' },
      { code: 'UNION', name: 'Union Bank of India', upiHandle: 'union' },
      { code: 'INDIAN', name: 'Indian Bank', upiHandle: 'indian' }
    ];
  }

  /**
   * Get Indian banks list
   * GET /api/payments/banks
   */
  async getIndianBanks(req, res) {
    try {
      const banks = PaymentController.getIndianBanks();
      
      res.json({
        success: true,
        data: { banks }
      });
      
    } catch (error) {
      console.error('❌ Get banks error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch banks'
      });
    }
  }
}

module.exports = new PaymentController();