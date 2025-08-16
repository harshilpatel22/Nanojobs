const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { prisma } = require('../config/database');

const router = express.Router();

/**
 * Real-time Authentication Routes with MSG91 SMS Integration
 * Production-ready authentication system for NanoJobs
 */

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

/**
 * Send SMS OTP using MSG91
 * @param {string} phone - 10-digit phone number
 * @param {string} otp - 6-digit OTP
 */
const sendSMSOTP = async (phone, otp) => {
  try {
    console.log(`📱 Sending OTP ${otp} to ${phone} via MSG91`);
    
    const MSG91_API_KEY = process.env.MSG91_API_KEY;
    const MSG91_SENDER_ID = process.env.MSG91_SENDER_ID || 'NANOJB';
    
    if (!MSG91_API_KEY) {
      throw new Error('MSG91_API_KEY not configured in environment variables');
    }
    
    // Format phone number (ensure 10 digits)
    const cleanPhone = phone.replace(/^\+91/, '').replace(/\D/g, '');
    
    if (cleanPhone.length !== 10) {
      throw new Error('Invalid phone number format');
    }
    
    // MSG91 SMS API call
    const response = await axios.post('https://api.msg91.com/api/v2/sendsms', {
      sender: MSG91_SENDER_ID,
      route: '4', // Transactional route
      country: '91',
      sms: [
        {
          message: `Your NanoJobs verification code is: ${otp}. Valid for 5 minutes. Do not share this code with anyone. - NanoJobs`,
          to: [cleanPhone]
        }
      ]
    }, {
      headers: {
        'authkey': MSG91_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });
    
    console.log('✅ MSG91 SMS sent successfully:', response.data);
    
    return { 
      success: true, 
      messageId: response.data.request_id || response.data.message_id || 'msg91_' + Date.now(),
      provider: 'MSG91',
      cost: 0.10 // Approximate cost in INR
    };
    
  } catch (error) {
    console.error('❌ MSG91 SMS sending failed:', error.response?.data || error.message);
    
    // Handle specific MSG91 errors
    if (error.response?.data) {
      const errorData = error.response.data;
      const errorMessage = errorData.message || errorData.error || 'Unknown error';
      
      if (errorMessage.includes('insufficient balance') || errorMessage.includes('balance')) {
        throw new Error('SMS service temporarily unavailable due to insufficient balance');
      } else if (errorMessage.includes('invalid number') || errorMessage.includes('number')) {
        throw new Error('Invalid phone number provided');
      } else if (errorMessage.includes('invalid authkey') || errorMessage.includes('authkey')) {
        throw new Error('SMS service configuration error');
      } else {
        throw new Error(`SMS service error: ${errorMessage}`);
      }
    }
    
    // Handle network errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      throw new Error('SMS service temporarily unavailable. Please try again.');
    }
    
    throw new Error(`Failed to send SMS: ${error.message}`);
  }
};

/**
 * Generate JWT session token
 * @param {Object} userData - User data for token
 */
const generateSessionToken = (userData) => {
  try {
    const payload = {
      userId: userData.userId,
      phone: userData.phone,
      userType: userData.userType,
      sessionId: uuidv4(),
      iat: Math.floor(Date.now() / 1000)
    };
    
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters long');
    }
    
    return jwt.sign(payload, jwtSecret, { 
      expiresIn: '30d',
      issuer: 'nanojobs',
      audience: 'nanojobs-users'
    });
  } catch (error) {
    console.error('❌ JWT generation failed:', error);
    throw new Error('Failed to generate session token');
  }
};

/**
 * Phone-based login with real SMS OTP
 * POST /api/auth/login
 */
router.post('/login',
  [
    body('phone')
      .trim()
      .matches(/^[6-9]\d{9}$/)
      .withMessage('Please provide a valid 10-digit Indian mobile number starting with 6-9')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { phone } = req.body;
      
      console.log(`🔐 Login attempt for phone: ${phone}`);
      
      // Check if user exists in database
      const user = await prisma.user.findUnique({
        where: { phone },
        include: {
          worker: true,
          employer: true
        }
      });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
          message: 'No account found with this phone number. Please register first.',
          suggestion: 'register'
        });
      }
      
      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          error: 'Account disabled',
          message: 'Your account has been disabled. Please contact support.'
        });
      }
      
      // Generate 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Clean up any existing expired sessions for this user
      try {
        await prisma.session.deleteMany({
          where: {
            userId: user.id,
            OR: [
              { expiresAt: { lt: new Date() } },
              { isActive: false }
            ]
          }
        });
      } catch (cleanupError) {
        console.warn('⚠️ Session cleanup warning:', cleanupError.message);
      }
      
      // Create new session in database
      const session = await prisma.session.create({
        data: {
          userId: user.id,
          token: uuidv4(), // Temporary token for OTP verification
          isActive: false, // Will be activated after OTP verification
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
          metadata: {
            otp: otp,
            phone: phone,
            otpSentAt: new Date().toISOString(),
            attempts: 0,
            userAgent: req.get('User-Agent') || 'unknown',
            ip: req.ip || 'unknown'
          }
        }
      });
      
      // Send SMS OTP
      try {
        const smsResult = await sendSMSOTP(phone, otp);
        
        console.log('✅ OTP sent successfully to:', phone, 'via', smsResult.provider);
        
        res.json({
          success: true,
          message: 'OTP sent successfully',
          data: {
            sessionId: session.id,
            phone: phone,
            otpSent: true,
            expiresIn: 300, // 5 minutes in seconds
            messageId: smsResult.messageId,
            provider: smsResult.provider
          }
        });
        
      } catch (smsError) {
        // If SMS fails, delete the session and return error
        try {
          await prisma.session.delete({ where: { id: session.id } });
        } catch (deleteError) {
          console.error('❌ Failed to cleanup session after SMS error:', deleteError);
        }
        
        console.error('❌ SMS sending failed for phone:', phone, 'Error:', smsError.message);
        
        res.status(500).json({
          success: false,
          error: 'SMS sending failed',
          message: smsError.message.includes('service') 
            ? smsError.message
            : 'Unable to send verification code. Please try again in a few minutes.'
        });
      }
      
    } catch (error) {
      console.error('❌ Login error:', error);
      
      res.status(500).json({
        success: false,
        error: 'Login failed',
        message: 'An error occurred during login. Please try again.'
      });
    }
  }
);

/**
 * Verify OTP with database integration
 * POST /api/auth/verify-otp
 */
router.post('/verify-otp',
  [
    body('sessionId')
      .notEmpty()
      .withMessage('Session ID is required'),
    body('otp')
      .isLength({ min: 6, max: 6 })
      .isNumeric()
      .withMessage('OTP must be exactly 6 digits')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { sessionId, otp } = req.body;
      
      console.log(`🔐 OTP verification for session: ${sessionId}`);
      
      // Get session from database
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          user: {
            include: {
              worker: true,
              employer: true
            }
          }
        }
      });
      
      if (!session) {
        return res.status(400).json({
          success: false,
          error: 'Invalid session',
          message: 'Session not found or expired. Please request a new OTP.'
        });
      }
      
      // Check if session expired
      if (new Date() > session.expiresAt) {
        try {
          await prisma.session.delete({ where: { id: sessionId } });
        } catch (deleteError) {
          console.warn('⚠️ Failed to delete expired session:', deleteError);
        }
        
        return res.status(400).json({
          success: false,
          error: 'OTP expired',
          message: 'OTP has expired. Please request a new one.'
        });
      }
      
      // Check OTP attempts (prevent brute force)
      const metadata = session.metadata || {};
      const attempts = metadata.attempts || 0;
      
      if (attempts >= 3) {
        try {
          await prisma.session.delete({ where: { id: sessionId } });
        } catch (deleteError) {
          console.warn('⚠️ Failed to delete session after max attempts:', deleteError);
        }
        
        return res.status(400).json({
          success: false,
          error: 'Too many attempts',
          message: 'Too many incorrect attempts. Please request a new OTP.'
        });
      }
      
      // Verify OTP
      const storedOTP = metadata.otp;
      if (!storedOTP || storedOTP !== otp) {
        // Increment attempts
        try {
          await prisma.session.update({
            where: { id: sessionId },
            data: {
              metadata: {
                ...metadata,
                attempts: attempts + 1,
                lastAttemptAt: new Date().toISOString()
              }
            }
          });
        } catch (updateError) {
          console.warn('⚠️ Failed to update attempts:', updateError);
        }
        
        const remainingAttempts = 2 - attempts;
        return res.status(400).json({
          success: false,
          error: 'Invalid OTP',
          message: `Incorrect OTP. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`
        });
      }
      
      // OTP verified successfully
      const user = session.user;
      
      if (!user || !user.isActive) {
        return res.status(403).json({
          success: false,
          error: 'Account inactive',
          message: 'User account is not active'
        });
      }
      
      // Determine user type and get specific user data
      let userType, userData, userId;
      
      if (user.worker) {
        userType = 'worker';
        userData = user.worker;
        userId = user.worker.id;
      } else if (user.employer) {
        userType = 'employer';
        userData = user.employer;
        userId = user.employer.id;
      } else {
        // Fallback to user type from user table
        userType = user.userType ? user.userType.toLowerCase() : 'worker';
        userData = null;
        userId = user.id;
      }
      
      // Generate JWT session token
      let sessionToken;
      try {
        sessionToken = generateSessionToken({
          userId: userId,
          phone: user.phone,
          userType: userType
        });
      } catch (jwtError) {
        console.error('❌ JWT generation failed:', jwtError);
        return res.status(500).json({
          success: false,
          error: 'Token generation failed',
          message: 'Unable to create session. Please try again.'
        });
      }
      
      // Update session in database with real token
      try {
        await prisma.session.update({
          where: { id: sessionId },
          data: {
            token: sessionToken,
            isActive: true,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            lastUsed: new Date(),
            metadata: {
              ...metadata,
              verifiedAt: new Date().toISOString(),
              userAgent: req.get('User-Agent'),
              ip: req.ip,
              loginSuccessful: true
            }
          }
        });
      } catch (updateError) {
        console.error('❌ Session update failed:', updateError);
        return res.status(500).json({
          success: false,
          error: 'Session update failed',  
          message: 'Login verification failed. Please try again.'
        });
      }
      
      console.log(`✅ Login successful: ${user.phone} as ${userType} (ID: ${userId})`);
      
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          sessionToken: sessionToken,
          user: {
            id: user.id,
            name: user.name,
            phone: user.phone,
            email: user.email,
            userType: user.userType
          },
          userType: userType,
          userId: userId,
          profile: userData
        }
      });
      
    } catch (error) {
      console.error('❌ OTP verification error:', error);
      res.status(500).json({
        success: false,
        error: 'Verification failed',
        message: 'Unable to verify OTP. Please try again.'
      });
    }
  }
);

/**
 * Check authentication status with JWT verification
 * GET /api/auth/status
 */
router.get('/status', async (req, res) => {
  try {
    const sessionToken = req.query.sessionToken || req.query.sessionId; // Support both parameter names
    
    if (!sessionToken) {
      return res.json({
        success: true,
        data: { 
          authenticated: false,
          reason: 'No session token provided'
        }
      });
    }
    
    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(sessionToken, process.env.JWT_SECRET);
    } catch (jwtError) {
      console.log('⚠️ JWT verification failed:', jwtError.message);
      return res.json({
        success: true,
        data: { 
          authenticated: false, 
          reason: jwtError.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token'
        }
      });
    }
    
    // Check if session exists in database and is active
    const session = await prisma.session.findFirst({
      where: {
        token: sessionToken,
        isActive: true,
        expiresAt: { gt: new Date() }
      },
      include: {
        user: {
          include: {
            worker: true,
            employer: true
          }
        }
      }
    });
    
    if (!session) {
      return res.json({
        success: true,
        data: { 
          authenticated: false, 
          reason: 'Session not found or expired'
        }
      });
    }
    
    // Update last used timestamp
    try {
      await prisma.session.update({
        where: { id: session.id },
        data: { lastUsed: new Date() }
      });
    } catch (updateError) {
      console.warn('⚠️ Failed to update last used:', updateError);
    }
    
    res.json({
      success: true,
      data: {
        authenticated: true,
        user: {
          id: session.user.id,
          name: session.user.name,
          phone: session.user.phone,
          userType: session.user.userType
        },
        sessionValid: true,
        expiresAt: session.expiresAt
      }
    });
    
  } catch (error) {
    console.error('❌ Auth status error:', error);
    res.status(500).json({
      success: false,
      error: 'Status check failed',
      message: 'Unable to check authentication status'
    });
  }
});

/**
 * Logout with database cleanup
 * POST /api/auth/logout
 */
router.post('/logout', async (req, res) => {
  try {
    const { sessionToken } = req.body;
    
    if (sessionToken) {
      try {
        // Deactivate session in database
        const result = await prisma.session.updateMany({
          where: { 
            token: sessionToken,
            isActive: true
          },
          data: { 
            isActive: false,
            lastUsed: new Date(),
            metadata: {
              loggedOutAt: new Date().toISOString()
            }
          }
        });
        
        if (result.count > 0) {
          console.log('✅ User logged out successfully');
        } else {
          console.log('⚠️ No active session found for logout');
        }
      } catch (dbError) {
        console.error('❌ Database logout error:', dbError);
        // Don't fail the logout request due to DB errors
      }
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
    
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Logout failed',
      message: 'Unable to logout. Please try again.'
    });
  }
});

/**
 * Cleanup expired sessions (maintenance endpoint)
 * GET /api/auth/cleanup
 */
router.get('/cleanup', async (req, res) => {
  try {
    const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago
    
    const result = await prisma.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } }, // Expired sessions
          { 
            isActive: false,
            lastUsed: { lt: cutoffDate } // Inactive sessions older than 24 hours
          }
        ]
      }
    });
    
    console.log(`🧹 Cleaned up ${result.count} expired/inactive sessions`);
    
    res.json({
      success: true,
      message: `Cleaned up ${result.count} expired sessions`,
      data: {
        deletedCount: result.count,
        cleanupTime: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    res.status(500).json({
      success: false,
      error: 'Cleanup failed',
      message: 'Unable to cleanup expired sessions'
    });
  }
});

/**
 * Resend OTP (if original SMS failed)
 * POST /api/auth/resend-otp
 */
router.post('/resend-otp',
  [
    body('sessionId')
      .notEmpty()
      .withMessage('Session ID is required')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { sessionId } = req.body;
      
      // Get existing session
      const session = await prisma.session.findUnique({
        where: { id: sessionId },
        include: { user: true }
      });
      
      if (!session) {
        return res.status(400).json({
          success: false,
          error: 'Invalid session',
          message: 'Session not found'
        });
      }
      
      // Check if session is still valid (within 5 minutes)
      if (new Date() > session.expiresAt) {
        try {
          await prisma.session.delete({ where: { id: sessionId } });
        } catch (deleteError) {
          console.warn('⚠️ Failed to delete expired session:', deleteError);
        }
        
        return res.status(400).json({
          success: false,
          error: 'Session expired',
          message: 'Session expired. Please start over.'
        });
      }
      
      const metadata = session.metadata || {};
      const phone = metadata.phone;
      
      if (!phone) {
        return res.status(400).json({
          success: false,
          error: 'Invalid session',
          message: 'Phone number not found in session'
        });
      }
      
      // Generate new OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Send SMS OTP
      try {
        const smsResult = await sendSMSOTP(phone, otp);
        
        // Update session with new OTP
        await prisma.session.update({
          where: { id: sessionId },
          data: {
            metadata: {
              ...metadata,
              otp: otp,
              otpSentAt: new Date().toISOString(),
              attempts: 0, // Reset attempts
              resendCount: (metadata.resendCount || 0) + 1
            }
          }
        });
        
        console.log('✅ OTP resent successfully to:', phone);
        
        res.json({
          success: true,
          message: 'OTP resent successfully',
          data: {
            sessionId: sessionId,
            phone: phone,
            otpSent: true,
            expiresIn: Math.floor((session.expiresAt - new Date()) / 1000),
            messageId: smsResult.messageId
          }
        });
        
      } catch (smsError) {
        console.error('❌ Resend SMS failed:', smsError.message);
        
        res.status(500).json({
          success: false,
          error: 'SMS sending failed',
          message: 'Unable to resend verification code. Please try again.'
        });
      }
      
    } catch (error) {
      console.error('❌ Resend OTP error:', error);
      res.status(500).json({
        success: false,
        error: 'Resend failed',
        message: 'Unable to resend OTP. Please try again.'
      });
    }
  }
);

/**
 * DEVELOPMENT ONLY - Direct login routes for testing
 * These bypass OTP verification for faster development/testing
 */
if (process.env.NODE_ENV === 'development') {
  
  /**
   * Direct Worker Login (Development Only)
   * POST /api/auth/dev-login-worker
   */
  router.post('/dev-login-worker', 
    [
      body('phone').isMobilePhone('en-IN').withMessage('Valid Indian phone number required')
    ],
    handleValidationErrors,
    async (req, res) => {
      try {
        const { phone } = req.body;
        console.log('🔧 DEV: Direct worker login for', phone);
        
        // Find or create user as worker
        let user = await prisma.user.findUnique({
          where: { phone },
          include: { worker: true, employer: true }
        });
        
        if (!user) {
          // Create new user and worker
          user = await prisma.user.create({
            data: {
              phone,
              name: `Test Worker ${phone.slice(-4)}`,
              userType: 'WORKER'
            }
          });
          
          await prisma.worker.create({
            data: {
              userId: user.id,
              registrationMethod: 'MANUAL',
              badge: 'BRONZE',
              skills: ['data-entry', 'content-writing'],
              experienceLevel: 'FRESHER'
            }
          });
          
          // Reload user with worker data
          user = await prisma.user.findUnique({
            where: { id: user.id },
            include: { worker: true, employer: true }
          });
        }
        
        // Ensure user has worker profile
        if (!user.worker) {
          await prisma.worker.create({
            data: {
              userId: user.id,
              registrationMethod: 'MANUAL',
              badge: 'BRONZE',
              skills: ['data-entry', 'content-writing'],
              experienceLevel: 'FRESHER'
            }
          });
          
          user = await prisma.user.findUnique({
            where: { id: user.id },
            include: { worker: true, employer: true }
          });
        }
        
        // Create JWT token
        const token = jwt.sign({
          userId: user.id,
          phone: user.phone,
          userType: 'worker'
        }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        // Create session
        await prisma.session.create({
          data: {
            userId: user.id,
            token,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            metadata: { loginType: 'dev-worker', userAgent: req.headers['user-agent'] }
          }
        });
        
        res.json({
          success: true,
          message: 'Development worker login successful',
          data: {
            user: {
              id: user.id,
              phone: user.phone,
              name: user.name,
              userType: 'worker'
            },
            worker: {
              id: user.worker.id,
              badge: user.worker.badge,
              skills: user.worker.skills,
              experienceLevel: user.worker.experienceLevel
            },
            token,
            expiresIn: '7d'
          }
        });
        
      } catch (error) {
        console.error('❌ Dev worker login error:', error);
        res.status(500).json({
          success: false,
          error: 'Development login failed',
          message: error.message
        });
      }
    }
  );
  
  /**
   * Direct Employer Login (Development Only)
   * POST /api/auth/dev-login-employer
   */
  router.post('/dev-login-employer',
    [
      body('phone').isMobilePhone('en-IN').withMessage('Valid Indian phone number required')
    ],
    handleValidationErrors,
    async (req, res) => {
      try {
        const { phone } = req.body;
        console.log('🔧 DEV: Direct employer login for', phone);
        
        // Find or create user as employer
        let user = await prisma.user.findUnique({
          where: { phone },
          include: { worker: true, employer: true }
        });
        
        if (!user) {
          // Create new user and employer
          user = await prisma.user.create({
            data: {
              phone,
              name: `Test Employer ${phone.slice(-4)}`,
              userType: 'EMPLOYER'
            }
          });
          
          await prisma.employer.create({
            data: {
              userId: user.id,
              employerType: 'INDIVIDUAL',
              businessCategory: 'startup',
              expectedTaskVolume: 'medium'
            }
          });
          
          // Reload user with employer data
          user = await prisma.user.findUnique({
            where: { id: user.id },
            include: { worker: true, employer: true }
          });
        }
        
        // Ensure user has employer profile
        if (!user.employer) {
          await prisma.employer.create({
            data: {
              userId: user.id,
              employerType: 'INDIVIDUAL',
              businessCategory: 'startup',
              expectedTaskVolume: 'medium'
            }
          });
          
          user = await prisma.user.findUnique({
            where: { id: user.id },
            include: { worker: true, employer: true }
          });
        }
        
        // Create JWT token
        const token = jwt.sign({
          userId: user.id,
          phone: user.phone,
          userType: 'employer'
        }, process.env.JWT_SECRET, { expiresIn: '7d' });
        
        // Create session
        await prisma.session.create({
          data: {
            userId: user.id,
            token,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            metadata: { loginType: 'dev-employer', userAgent: req.headers['user-agent'] }
          }
        });
        
        res.json({
          success: true,
          message: 'Development employer login successful',
          data: {
            user: {
              id: user.id,
              phone: user.phone,
              name: user.name,
              userType: 'employer'
            },
            employer: {
              id: user.employer.id,
              employerType: user.employer.employerType,
              businessCategory: user.employer.businessCategory,
              isVerified: user.employer.isVerified
            },
            token,
            expiresIn: '7d'
          }
        });
        
      } catch (error) {
        console.error('❌ Dev employer login error:', error);
        res.status(500).json({
          success: false,
          error: 'Development login failed',
          message: error.message
        });
      }
    }
  );
  
  console.log('🔧 Development auth routes loaded: /api/auth/dev-login-worker, /api/auth/dev-login-employer');
}

module.exports = router;