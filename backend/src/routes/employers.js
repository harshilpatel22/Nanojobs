const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const employerController = require('../controllers/employerController');

const router = express.Router();

/**
 * Validation middleware to handle express-validator errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: 'Please check your input data',
      details: errors.array()
    });
  }
  next();
};

/**
 * Employer Registration Routes
 */

// Register new employer
router.post('/register',
  [
    body('name')
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters')
      .matches(/^[a-zA-Z\s\.-]+$/)
      .withMessage('Name can only contain letters, spaces, dots, and hyphens'),
    
    body('phone')
      .trim()
      .isMobilePhone('en-IN')
      .withMessage('Please provide a valid Indian mobile number'),
    
    body('email')
      .optional()
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    
    body('employerType')
      .isIn(['individual', 'small_business', 'company'])
      .withMessage('Employer type must be individual, small_business, or company'),
    
    body('companyName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Company name must be between 2 and 100 characters'),
    
    body('website')
      .optional()
      .trim()
      .isURL({ protocols: ['http', 'https'], require_protocol: true })
      .withMessage('Please provide a valid website URL'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters'),
    
    body('businessCategory')
      .optional()
      .isIn([
        'technology', 'marketing', 'design', 'writing', 'consulting', 
        'education', 'healthcare', 'finance', 'retail', 'manufacturing', 
        'construction', 'transportation', 'hospitality', 'other'
      ])
      .withMessage('Please select a valid business category'),
    
    body('expectedTaskVolume')
      .optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('Expected task volume must be low, medium, or high')
  ],
  
  handleValidationErrors,
  employerController.registerEmployer
);

/**
 * Employer Profile Management Routes
 */

// Get employer profile by ID
router.get('/:id',
  [
    param('id')
      .isString()
      .isLength({ min: 10 })
      .withMessage('Invalid employer ID format')
  ],
  handleValidationErrors,
  employerController.getEmployerProfile
);

// Update employer profile
router.put('/:id',
  [
    param('id')
      .isString()
      .isLength({ min: 10 })
      .withMessage('Invalid employer ID format'),
    
    body('name')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Name must be between 2 and 100 characters'),
    
    body('email')
      .optional()
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    
    body('companyName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Company name must be between 2 and 100 characters'),
    
    body('website')
      .optional()
      .trim()
      .isURL({ protocols: ['http', 'https'], require_protocol: true })
      .withMessage('Please provide a valid website URL'),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must be less than 1000 characters'),
    
    body('businessCategory')
      .optional()
      .isIn([
        'technology', 'marketing', 'design', 'writing', 'consulting', 
        'education', 'healthcare', 'finance', 'retail', 'manufacturing', 
        'construction', 'transportation', 'hospitality', 'other'
      ])
      .withMessage('Please select a valid business category'),
    
    body('expectedTaskVolume')
      .optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('Expected task volume must be low, medium, or high')
  ],
  
  handleValidationErrors,
  employerController.updateEmployerProfile
);

/**
 * Employer Statistics and Analytics Routes
 */

// Get employer dashboard statistics
router.get('/:id/stats',
  [
    param('id')
      .isString()
      .isLength({ min: 10 })
      .withMessage('Invalid employer ID format')
  ],
  handleValidationErrors,
  employerController.getEmployerStats
);

/**
 * Employer Management Routes (Admin)
 */

// Get all employers (with filtering and pagination)
router.get('/',
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    
    query('verified')
      .optional()
      .isBoolean()
      .withMessage('Verified must be true or false'),
    
    query('category')
      .optional()
      .isIn([
        'technology', 'marketing', 'design', 'writing', 'consulting', 
        'education', 'healthcare', 'finance', 'retail', 'manufacturing', 
        'construction', 'transportation', 'hospitality', 'other'
      ])
      .withMessage('Invalid business category')
  ],
  handleValidationErrors,
  employerController.getAllEmployers
);

// Verify employer (admin only)
router.post('/:id/verify',
  [
    param('id')
      .isString()
      .isLength({ min: 10 })
      .withMessage('Invalid employer ID format'),
    
    body('verified')
      .isBoolean()
      .withMessage('Verified status must be true or false'),
    
    body('verificationNote')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('Verification note must be less than 500 characters')
  ],
  handleValidationErrors,
  employerController.verifyEmployer
);

/**
 * Utility Routes
 */

// Get business categories
router.get('/config/business-categories', (req, res) => {
  try {
    const categories = [
      { value: 'technology', label: 'Technology & IT', description: 'Software, web development, IT services' },
      { value: 'marketing', label: 'Marketing & Advertising', description: 'Digital marketing, content, social media' },
      { value: 'design', label: 'Design & Creative', description: 'Graphic design, UI/UX, creative services' },
      { value: 'writing', label: 'Writing & Translation', description: 'Content writing, copywriting, translation' },
      { value: 'consulting', label: 'Consulting & Strategy', description: 'Business consulting, strategy, advisory' },
      { value: 'education', label: 'Education & Training', description: 'Online tutoring, course creation, training' },
      { value: 'healthcare', label: 'Healthcare & Wellness', description: 'Medical services, wellness, healthcare' },
      { value: 'finance', label: 'Finance & Accounting', description: 'Accounting, bookkeeping, financial services' },
      { value: 'retail', label: 'Retail & E-commerce', description: 'Online retail, e-commerce, product sales' },
      { value: 'manufacturing', label: 'Manufacturing & Production', description: 'Manufacturing, production, industrial' },
      { value: 'construction', label: 'Construction & Real Estate', description: 'Construction, architecture, real estate' },
      { value: 'transportation', label: 'Transportation & Logistics', description: 'Logistics, delivery, transportation' },
      { value: 'hospitality', label: 'Hospitality & Tourism', description: 'Hotels, restaurants, travel, tourism' },
      { value: 'other', label: 'Other', description: 'Other business types not listed above' }
    ];
    
    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch business categories'
    });
  }
});

// Get employer types
router.get('/config/employer-types', (req, res) => {
  try {
    const employerTypes = [
      { 
        value: 'individual', 
        label: 'Individual/Freelancer', 
        description: 'Individual looking for task assistance',
        features: ['Simple registration', 'Quick task posting', 'Basic verification']
      },
      { 
        value: 'small_business', 
        label: 'Small Business', 
        description: 'Small business or startup (1-50 employees)',
        features: ['Company profile', 'Bulk task posting', 'Priority support']
      },
      { 
        value: 'company', 
        label: 'Large Company', 
        description: 'Established company (50+ employees)',
        features: ['Enterprise features', 'Custom solutions', 'Dedicated account manager']
      }
    ];
    
    res.json({
      success: true,
      data: { employerTypes }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch employer types'
    });
  }
});

/**
 * Error handling middleware for this router
 */
router.use((error, req, res, next) => {
  console.error('Employer routes error:', error);
  
  res.status(error.status || 500).json({
    success: false,
    error: 'Employer service error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An error occurred processing your request' 
      : error.message
  });
});

module.exports = router;