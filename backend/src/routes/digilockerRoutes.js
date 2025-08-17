/**
 * DigiLocker Integration Routes
 * Handles OAuth flow and Aadhar verification
 */

const express = require('express');
const router = express.Router();
const { prisma } = require('../config/database');
const digilockerService = require('../services/digilockerService');
const authMiddleware = require('../middleware/auth');

/**
 * @route   POST /api/auth/digilocker/initiate
 * @desc    Initiate DigiLocker OAuth flow
 * @access  Public
 * @body    { tempUserId, userType }
 */
router.post('/initiate', async (req, res) => {
  try {
    const { tempUserId, userType = 'worker' } = req.body;

    if (!tempUserId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Temporary user ID is required to initiate verification'
      });
    }

    console.log('🔄 Initiating DigiLocker OAuth for user:', tempUserId);

    // Generate secure state parameter
    const state = digilockerService.generateState(tempUserId);
    
    // Generate DigiLocker authorization URL
    const authUrl = digilockerService.generateAuthUrl(state);

    // Store state temporarily in database for verification
    await prisma.$executeRaw`
      INSERT INTO verification_sessions (id, user_id, user_type, state, created_at, expires_at)
      VALUES (${`dl_${tempUserId}_${Date.now()}`}, ${tempUserId}, ${userType}, ${state}, NOW(), NOW() + INTERVAL '10 minutes')
      ON CONFLICT (user_id) DO UPDATE SET 
        state = ${state}, 
        created_at = NOW(), 
        expires_at = NOW() + INTERVAL '10 minutes'
    `;

    console.log('✅ DigiLocker OAuth initiated successfully');

    return res.json({
      success: true,
      data: {
        authUrl,
        state,
        redirectUrl: authUrl
      },
      message: 'DigiLocker verification initiated. Please complete authorization.'
    });

  } catch (error) {
    console.error('❌ DigiLocker initiation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to initiate verification',
      message: 'Unable to start DigiLocker verification process'
    });
  }
});

/**
 * @route   GET /api/auth/digilocker/callback
 * @desc    Handle DigiLocker OAuth callback
 * @access  Public
 * @query   code, state
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      console.error('❌ DigiLocker OAuth error:', error);
      return res.redirect(`${process.env.FRONTEND_URL}/registration-error?error=digilocker_auth_failed`);
    }

    if (!code || !state) {
      return res.redirect(`${process.env.FRONTEND_URL}/registration-error?error=missing_parameters`);
    }

    console.log('🔄 Processing DigiLocker callback...');

    // Verify state parameter
    const [userId] = state.split('_');
    
    // Get verification session from database
    const session = await prisma.$queryRaw`
      SELECT * FROM verification_sessions 
      WHERE user_id = ${userId} AND state = ${state} AND expires_at > NOW()
      LIMIT 1
    `;

    if (!session || session.length === 0) {
      console.error('❌ Invalid or expired verification session');
      return res.redirect(`${process.env.FRONTEND_URL}/registration-error?error=invalid_session`);
    }

    // Exchange code for access token
    const tokenData = await digilockerService.exchangeCodeForToken(code, state);
    
    // Get Aadhar information
    const aadharInfo = await digilockerService.getAadharInfo(tokenData.access_token);
    
    // Store verification data
    const verificationData = {
      userId: userId,
      aadhaarNumber: aadharInfo.aadhaarNumber,
      verifiedName: aadharInfo.name,
      verifiedDOB: aadharInfo.dateOfBirth,
      verifiedAddress: JSON.stringify(aadharInfo.address),
      isVerified: true,
      verifiedAt: new Date(),
      verificationMethod: 'digilocker'
    };

    // Store in database
    await prisma.$executeRaw`
      INSERT INTO digilocker_verifications 
      (user_id, aadhaar_number, verified_name, verified_dob, verified_address, is_verified, verified_at, verification_method)
      VALUES (${verificationData.userId}, ${verificationData.aadhaarNumber}, ${verificationData.verifiedName}, 
              ${verificationData.verifiedDOB}, ${verificationData.verifiedAddress}, ${verificationData.isVerified}, 
              ${verificationData.verifiedAt}, ${verificationData.verificationMethod})
      ON CONFLICT (user_id) DO UPDATE SET
        aadhaar_number = ${verificationData.aadhaarNumber},
        verified_name = ${verificationData.verifiedName},
        verified_dob = ${verificationData.verifiedDOB},
        verified_address = ${verificationData.verifiedAddress},
        is_verified = ${verificationData.isVerified},
        verified_at = ${verificationData.verifiedAt}
    `;

    // Clean up verification session
    await prisma.$executeRaw`
      DELETE FROM verification_sessions WHERE user_id = ${userId}
    `;

    console.log('✅ DigiLocker verification completed successfully');

    // Redirect to success page
    return res.redirect(`${process.env.FRONTEND_URL}/registration-success?verified=true&method=digilocker`);

  } catch (error) {
    console.error('❌ DigiLocker callback error:', error);
    return res.redirect(`${process.env.FRONTEND_URL}/registration-error?error=verification_failed`);
  }
});

/**
 * @route   GET /api/auth/digilocker/status/:userId
 * @desc    Check DigiLocker verification status
 * @access  Public
 */
router.get('/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('🔍 Checking DigiLocker verification status for:', userId);

    // Check verification status
    const verification = await prisma.digilockerVerification.findUnique({
      where: { userId: userId },
      select: {
        userId: true,
        aadhaarNumber: true,
        verifiedName: true,
        isVerified: true,
        verifiedAt: true,
        verificationMethod: true
      }
    });

    if (!verification) {
      return res.json({
        success: true,
        data: {
          isVerified: false,
          status: 'pending',
          message: 'No verification found for this user'
        }
      });
    }

    return res.json({
      success: true,
      data: {
        isVerified: verification.isVerified,
        status: verification.isVerified ? 'verified' : 'pending',
        verifiedAt: verification.verifiedAt,
        verificationMethod: verification.verificationMethod,
        aadhaarNumber: verification.aadhaarNumber ? 
          `${verification.aadhaarNumber.substring(0, 4)}****${verification.aadhaarNumber.substring(8)}` : null,
        verifiedName: verification.verifiedName
      }
    });

  } catch (error) {
    console.error('❌ DigiLocker status check error:', error);
    return res.status(500).json({
      success: false,
      error: 'Status check failed',
      message: 'Unable to check verification status'
    });
  }
});

/**
 * @route   GET /api/auth/digilocker/health
 * @desc    Health check for DigiLocker service
 * @access  Public
 */
router.get('/health', async (req, res) => {
  try {
    const health = await digilockerService.healthCheck();
    
    return res.json({
      success: true,
      data: health
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Health check failed',
      data: { status: 'unhealthy', error: error.message }
    });
  }
});

/**
 * @route   POST /api/auth/digilocker/mock-verify
 * @desc    Mock verification for testing (sandbox only)
 * @access  Public
 */
router.post('/mock-verify', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: 'Mock verification not allowed in production'
      });
    }

    const { userId, aadhaarNumber } = req.body;

    if (!userId || !aadhaarNumber) {
      return res.status(400).json({
        success: false,
        error: 'User ID and Aadhaar number required for mock verification'
      });
    }

    // Generate mock verification data
    const mockData = digilockerService.generateMockAadharData();
    mockData.aadhaarNumber = aadhaarNumber;

    // Store mock verification using Prisma client
    await prisma.digilockerVerification.upsert({
      where: { userId: userId },
      update: {
        aadhaarNumber: mockData.aadhaarNumber,
        verifiedName: mockData.name,
        isVerified: true,
        verifiedAt: new Date(),
        verificationMethod: 'mock_digilocker'
      },
      create: {
        userId: userId,
        aadhaarNumber: mockData.aadhaarNumber,
        verifiedName: mockData.name,
        verifiedDob: mockData.dateOfBirth,
        verifiedAddress: JSON.stringify(mockData.address),
        isVerified: true,
        verifiedAt: new Date(),
        verificationMethod: 'mock_digilocker'
      }
    });

    console.log('✅ Mock DigiLocker verification completed');

    return res.json({
      success: true,
      data: {
        isVerified: true,
        verificationMethod: 'mock_digilocker',
        aadhaarNumber: `${aadhaarNumber.substring(0, 4)}****${aadhaarNumber.substring(8)}`,
        verifiedName: mockData.name,
        mockData: true
      },
      message: 'Mock verification completed successfully'
    });

  } catch (error) {
    console.error('❌ Mock verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'Mock verification failed'
    });
  }
});

module.exports = router;