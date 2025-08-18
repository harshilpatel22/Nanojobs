/**
 * Basic Worker Registration Routes
 * Simplified registration system with ID verification
 */

const express = require('express');
const router = express.Router();

// Import controllers
const {
  registerBasicWorker,
  getWorkerProfile,
  getBadgeCategories,
  updateWorkerProfile
} = require('../controllers/basicWorkerController');

// Import middleware
const authMiddleware = require('../middleware/auth');
const { 
  handleIdDocumentUpload,
  handleAadhaarUpload,
  validateIdDocument,
  serveIdDocument 
} = require('../middleware/idDocumentUpload');

/**
 * @route   POST /api/workers/register-basic-digilocker
 * @desc    Register worker with DigiLocker verification only (no file upload)
 * @access  Public
 * @body    name, phone, email, city, state, pincode, dateOfBirth, aadhaarNumber, tempUserId, isDigiLockerVerified
 */
router.post('/register-basic-digilocker',
  registerBasicWorker
);

/**
 * @route   POST /api/workers/register-basic
 * @desc    Register worker with basic info + ID verification (supports DigiLocker, manual upload, or skip)
 * @access  Public
 * @body    name, phone, email, city, state, pincode, dateOfBirth, aadhaarNumber, tempUserId, isDigiLockerVerified, verificationSkipped, skills, experienceLevel, preferredCategories
 * @files   aadhaarDocument - Optional Aadhaar document file (photo or PDF)
 */
router.post('/register-basic',
  handleAadhaarUpload,
  registerBasicWorker
);


/**
 * @route   GET /api/workers/:id/profile
 * @desc    Get worker profile with category badges
 * @access  Protected
 */
router.get('/:id/profile',
  authMiddleware.authenticateToken,
  getWorkerProfile
);

/**
 * @route   PUT /api/workers/:id/profile
 * @desc    Update worker profile
 * @access  Protected
 */
router.put('/:id/profile',
  authMiddleware.authenticateToken,
  updateWorkerProfile
);

/**
 * @route   GET /api/workers/badge-categories
 * @desc    Get available categories for badge earning
 * @access  Public
 */
router.get('/badge-categories', getBadgeCategories);

/**
 * @route   GET /api/workers/id-document/:filename
 * @desc    Serve ID document files
 * @access  Protected
 */
router.get('/id-document/:filename',
  authMiddleware.authenticateToken,
  serveIdDocument
);

module.exports = router;