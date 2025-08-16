/**
 * Trial Task Validation Middleware
 * Production-ready validation for trial task submissions
 * 
 * Features:
 * - Comprehensive data validation
 * - Security checks and sanitization
 * - Performance monitoring
 * - Rate limiting for submissions
 * - Task-specific validation rules
 */

const rateLimit = require('express-rate-limit');
const { prisma } = require('../config/database');

/**
 * Rate limiting for trial task submissions
 * Prevents spam and ensures fair usage
 */
const trialTaskSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Maximum 10 submissions per 15 minutes per IP
  message: {
    success: false,
    error: 'Too many trial task submissions',
    message: 'Please wait before submitting another trial task. Maximum 10 submissions per 15 minutes.',
    retryAfter: 900 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Use IP + worker ID for more granular limiting
    const workerId = req.body.workerId || req.query.workerId || 'anonymous';
    return `${req.ip}_${workerId}`;
  }
});

/**
 * Validate trial task submission data
 * Comprehensive validation for all submission types
 */
const validateTrialSubmission = async (req, res, next) => {
  try {
    console.log('🔍 Validating trial task submission:', req.params.taskId);
    
    const { taskId } = req.params;
    const { workerId, workerData, submittedWork, timeSpent, performanceMetrics } = req.body;

    const errors = [];

    // 1. Basic required field validation
    if (!taskId || typeof taskId !== 'string') {
      errors.push('Valid task ID is required');
    }

    if (!submittedWork || typeof submittedWork !== 'object') {
      errors.push('Submitted work data is required');
    }

    if (typeof timeSpent !== 'number' || timeSpent < 0 || timeSpent > 300) {
      errors.push('Time spent must be between 0 and 300 minutes');
    }

    // 2. Worker data validation
    if (workerData && typeof workerData === 'object') {
      if (workerData.name && (typeof workerData.name !== 'string' || workerData.name.trim().length < 2)) {
        errors.push('Worker name must be at least 2 characters');
      }

      if (workerData.phone && !/^[6-9]\d{9}$/.test(workerData.phone.replace(/\D/g, ''))) {
        errors.push('Invalid Indian mobile number format');
      }

      if (workerData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(workerData.email)) {
        errors.push('Invalid email format');
      }
    }

    // 3. Check if trial task exists and is active
    const trialTask = await prisma.trialTask.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        title: true,
        category: true,
        timeLimit: true,
        isActive: true,
        accuracyThreshold: true,
        sampleData: true,
        expectedOutput: true
      }
    });

    if (!trialTask) {
      errors.push('Trial task not found');
    } else if (!trialTask.isActive) {
      errors.push('Trial task is not currently active');
    } else {
      // Store trial task data for use in controller
      req.trialTask = trialTask;
      
      // 4. Task-specific validation
      const taskValidation = validateTaskSpecificData(trialTask, submittedWork);
      if (!taskValidation.valid) {
        errors.push(...taskValidation.errors);
      }
    }

    // 5. Performance metrics validation
    if (performanceMetrics && typeof performanceMetrics !== 'object') {
      errors.push('Performance metrics must be an object');
    }

    // 6. Check for duplicate submissions (if worker is registered)
    if (workerId && !workerId.startsWith('trial_') && !workerId.startsWith('temp_')) {
      const existingSubmission = await prisma.trialTaskSubmission.findFirst({
        where: {
          trialTaskId: taskId,
          workerId: workerId,
          submittedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        select: { id: true }
      });

      if (existingSubmission) {
        errors.push('You have already submitted this trial task today. Please try a different task.');
      }
    }

    // 7. Data sanitization
    if (submittedWork) {
      req.body.submittedWork = sanitizeSubmittedWork(submittedWork);
    }

    if (workerData) {
      req.body.workerData = sanitizeWorkerData(workerData);
    }

    // Return validation results
    if (errors.length > 0) {
      console.log('❌ Trial submission validation failed:', errors);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Trial task submission validation failed',
        details: errors,
        timestamp: new Date().toISOString()
      });
    }

    console.log('✅ Trial submission validation passed');
    next();

  } catch (error) {
    console.error('❌ Trial submission validation error:', error);
    res.status(500).json({
      success: false,
      error: 'Validation error',
      message: 'An error occurred during validation',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Validate task-specific submission data
 * Each task type has specific requirements
 */
function validateTaskSpecificData(trialTask, submittedWork) {
  const errors = [];
  const category = trialTask.category;

  switch (category) {
    case 'DATA_ENTRY':
      errors.push(...validateDataEntrySubmission(submittedWork));
      break;
      
    case 'CONTENT':
      errors.push(...validateContentSubmission(submittedWork));
      break;
      
    case 'ORGANIZATION':
      errors.push(...validateOrganizationSubmission(submittedWork));
      break;
      
    case 'RESEARCH':
      errors.push(...validateResearchSubmission(submittedWork));
      break;
      
    case 'COMMUNICATION':
      errors.push(...validateCommunicationSubmission(submittedWork));
      break;
      
    default:
      // Generic validation for unknown task types
      if (Object.keys(submittedWork).length === 0) {
        errors.push('Submitted work cannot be empty');
      }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Data Entry Task Validation - IMPROVED with graceful handling
 * Now handles missing/null data gracefully and provides partial credit
 */
function validateDataEntrySubmission(submittedWork) {
  const errors = [];
  const warnings = [];
  
  // Check for entry fields
  const entryFields = Object.keys(submittedWork).filter(key => key.startsWith('entry_'));
  
  if (entryFields.length === 0) {
    errors.push('Please attempt at least one data entry to demonstrate your skills');
    return errors;
  }

  // Count actual entries attempted
  const entryCount = Math.max(...entryFields.map(key => {
    const match = key.match(/entry_(\d+)_/);
    return match ? parseInt(match[1]) : -1;
  })) + 1;

  let validEntries = 0;
  let partialEntries = 0;
  let totalFieldsAttempted = 0;

  for (let i = 0; i < entryCount; i++) {
    const name = submittedWork[`entry_${i}_name`];
    const phone = submittedWork[`entry_${i}_phone`];
    const email = submittedWork[`entry_${i}_email`];
    const city = submittedWork[`entry_${i}_city`];

    // Count fields with any content (including just spaces)
    const fieldsWithContent = [name, phone, email, city].filter(field => 
      field && typeof field === 'string' && field.trim().length > 0
    );

    // Skip completely empty entries (this is OK - user might not have data)
    if (fieldsWithContent.length === 0) {
      continue;
    }

    totalFieldsAttempted += fieldsWithContent.length;

    // This is a partial or complete entry - give credit for the attempt
    if (fieldsWithContent.length >= 2) {
      validEntries++;
    } else if (fieldsWithContent.length === 1) {
      partialEntries++;
      warnings.push(`Entry ${i + 1}: Only one field filled - try to complete more fields when data is available`);
    }

    // Validate fields that have content (graceful validation)
    if (name && name.trim().length > 0) {
      if (name.trim().length < 2) {
        warnings.push(`Entry ${i + 1}: Name "${name}" seems very short - please double-check`);
      } else if (name.trim().length > 50) {
        warnings.push(`Entry ${i + 1}: Name seems unusually long - please verify`);
      }
    }

    if (phone && phone.trim().length > 0) {
      const cleanPhone = phone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        warnings.push(`Entry ${i + 1}: Phone "${phone}" seems incomplete (found ${cleanPhone.length} digits)`);
      } else if (cleanPhone.length > 12) {
        warnings.push(`Entry ${i + 1}: Phone "${phone}" seems too long (found ${cleanPhone.length} digits)`);
      } else if (!/^[6-9]/.test(cleanPhone) && cleanPhone.length === 10) {
        warnings.push(`Entry ${i + 1}: Phone "${phone}" doesn't start with 6-9 (are you sure it's an Indian mobile?)`);
      }
    }

    if (email && email.trim().length > 0) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        warnings.push(`Entry ${i + 1}: Email "${email}" format looks unusual - please verify`);
      } else if (!email.includes('.')) {
        warnings.push(`Entry ${i + 1}: Email "${email}" missing domain extension - please check`);
      }
    }

    if (city && city.trim().length > 0) {
      if (city.trim().length < 2) {
        warnings.push(`Entry ${i + 1}: City "${city}" seems very short`);
      } else if (/\d/.test(city.trim())) {
        warnings.push(`Entry ${i + 1}: City "${city}" contains numbers - please verify`);
      }
    }
  }

  // Provide encouraging feedback instead of strict errors
  if (validEntries === 0 && partialEntries === 0) {
    errors.push('Please fill in at least some fields to show your data entry skills');
  } else {
    // Success feedback - focus on positive
    if (validEntries > 0) {
      console.log(`✅ Found ${validEntries} good entries and ${partialEntries} partial entries`);
    }
    
    // Only add gentle guidance, not errors
    if (totalFieldsAttempted < 5) {
      warnings.push('Tip: In real tasks, try to fill as many available fields as possible for higher pay');
    }
  }

  // Attach warnings to errors array for now (can be separated later)
  if (warnings.length > 0 && errors.length === 0) {
    // Convert warnings to non-blocking feedback
    console.log('📋 Data entry feedback:', warnings);
  }

  return errors; // Return only blocking errors, warnings are logged
}

/**
 * Content Creation Task Validation - IMPROVED for realistic writing assessment
 * Focuses on effort and creativity over strict requirements
 */
function validateContentSubmission(submittedWork) {
  const errors = [];
  const warnings = [];
  
  if (!submittedWork.content || typeof submittedWork.content !== 'string') {
    errors.push('Please write some content to showcase your writing skills');
    return errors;
  }

  const content = submittedWork.content.trim();
  
  // Minimum effort check - be encouraging
  if (content.length === 0) {
    errors.push('Please write something to demonstrate your content creation abilities');
    return errors;
  }

  if (content.length < 30) {
    errors.push('Please write at least a few sentences to show your writing style (minimum 30 characters)');
    return errors;
  }

  // Reasonable maximum to prevent abuse
  if (content.length > 10000) {
    warnings.push('Content is quite long - for most client tasks, concise writing is preferred');
  }

  // Check for minimum word count - but be flexible
  const words = content.split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;
  
  if (wordCount < 10) {
    errors.push('Please write at least 10 words to demonstrate your writing ability');
    return errors;
  }

  // Quality guidance - not strict requirements
  if (wordCount < 30) {
    warnings.push('Consider writing a bit more to fully showcase your skills (currently ' + wordCount + ' words)');
  }

  // Writing quality checks - provide gentle feedback
  if (content === content.toUpperCase() && content.length > 20) {
    warnings.push('Consider using normal capitalization for better readability');
  }

  if (content === content.toLowerCase() && content.length > 20) {
    warnings.push('Try using proper capitalization to make your content more professional');
  }

  // Check for repeated words (sign of low effort)
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  const repetitionRatio = uniqueWords.size / wordCount;
  
  if (repetitionRatio < 0.5 && wordCount > 20) {
    warnings.push('Try using more varied vocabulary to make your content more engaging');
  }

  // Check for basic sentence structure
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length < 2 && wordCount > 15) {
    warnings.push('Consider breaking your content into multiple sentences for better flow');
  }

  // Positive reinforcement
  if (wordCount >= 50) {
    console.log(`✅ Good content length: ${wordCount} words`);
  }
  
  if (uniqueWords.size / wordCount > 0.7) {
    console.log(`✅ Great vocabulary variety!`);
  }

  // Provide constructive feedback without blocking submission
  if (warnings.length > 0 && errors.length === 0) {
    console.log('📝 Content feedback:', warnings);
  }

  return errors; // Only blocking errors that prevent assessment
}

/**
 * Organization Task Validation - IMPROVED with realistic expectations
 * Handles messy real-world data and rewards effort over perfection
 */
function validateOrganizationSubmission(submittedWork) {
  const errors = [];
  const warnings = [];
  
  // Check for organization fields
  const orgFields = Object.keys(submittedWork).filter(key => key.startsWith('org_'));
  
  if (orgFields.length === 0) {
    errors.push('Please organize at least some contacts to demonstrate your skills');
    return errors;
  }

  // Validate organized contacts
  const contactCount = Math.max(...orgFields.map(key => {
    const match = key.match(/org_(\d+)_/);
    return match ? parseInt(match[1]) : -1;
  })) + 1;

  let validContacts = 0;
  let partialContacts = 0;
  let organizationEffort = 0;

  for (let i = 0; i < contactCount; i++) {
    const name = submittedWork[`org_${i}_name`];
    const phone = submittedWork[`org_${i}_phone`];
    const email = submittedWork[`org_${i}_email`];
    const company = submittedWork[`org_${i}_company`];

    // Count fields with meaningful content
    const fieldsWithContent = [name, phone, email, company].filter(field => 
      field && typeof field === 'string' && field.trim().length > 0
    );

    // Skip completely empty contacts
    if (fieldsWithContent.length === 0) {
      continue;
    }

    organizationEffort += fieldsWithContent.length;

    // Give credit for any organization attempt
    if (fieldsWithContent.length >= 3) {
      validContacts++;
    } else if (fieldsWithContent.length >= 1) {
      partialContacts++;
    }

    // Constructive validation - focus on helping improve
    if (name && name.trim().length > 0) {
      // Check for common name formatting issues
      if (name.toLowerCase() === name) {
        warnings.push(`Contact ${i + 1}: Consider proper capitalization for "${name}"`);
      }
      if (name.includes('  ')) {
        warnings.push(`Contact ${i + 1}: Extra spaces in name "${name}" - clients appreciate clean formatting`);
      }
    }

    if (phone && phone.trim().length > 0) {
      const cleanPhone = phone.replace(/[^\d\+]/g, '');
      if (cleanPhone.length === 0) {
        warnings.push(`Contact ${i + 1}: Phone field contains no digits`);
      } else if (cleanPhone.length < 10) {
        warnings.push(`Contact ${i + 1}: Phone "${phone}" might be incomplete (${cleanPhone.length} digits)`);
      }
      // Don't be too strict - real data is messy
    }

    if (email && email.trim().length > 0) {
      if (!email.includes('@')) {
        warnings.push(`Contact ${i + 1}: Email "${email}" missing @ symbol`);
      } else if (!email.includes('.')) {
        warnings.push(`Contact ${i + 1}: Email "${email}" missing domain extension`);
      } else if (email.trim() !== email) {
        warnings.push(`Contact ${i + 1}: Email has extra spaces - consider trimming`);
      }
    }

    if (company && company.trim().length > 0) {
      // Check for common company formatting improvements
      if (company.toLowerCase() === company) {
        warnings.push(`Contact ${i + 1}: Consider proper capitalization for company "${company}"`);
      }
    }
  }

  // Reward effort and provide encouragement
  if (validContacts === 0 && partialContacts === 0) {
    errors.push('Please organize at least one contact with some information');
  } else {
    console.log(`✅ Organization effort: ${validContacts} complete + ${partialContacts} partial contacts`);
    
    // Provide constructive guidance instead of errors
    if (organizationEffort < 8) {
      warnings.push('Tip: In real client projects, more complete information typically means higher ratings');
    }
    
    if (validContacts > 0) {
      console.log(`👍 Great work organizing ${validContacts} contacts!`);
    }
  }

  // Log warnings as feedback, don't block submission
  if (warnings.length > 0 && errors.length === 0) {
    console.log('📋 Organization feedback:', warnings);
  }

  return errors; // Only return blocking errors
}

/**
 * Research Task Validation
 */
function validateResearchSubmission(submittedWork) {
  const errors = [];
  
  if (!submittedWork.research) {
    errors.push('Research findings are required');
    return errors;
  }

  const research = submittedWork.research.trim();
  
  if (research.length < 100) {
    errors.push('Research findings must be at least 100 characters long');
  }

  return errors;
}

/**
 * Communication Task Validation
 */
function validateCommunicationSubmission(submittedWork) {
  const errors = [];
  
  if (!submittedWork.communication) {
    errors.push('Communication content is required');
    return errors;
  }

  const communication = submittedWork.communication.trim();
  
  if (communication.length < 30) {
    errors.push('Communication content must be at least 30 characters long');
  }

  return errors;
}

/**
 * Sanitize submitted work data
 * Remove potentially harmful content and normalize data
 */
function sanitizeSubmittedWork(submittedWork) {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(submittedWork)) {
    if (typeof value === 'string') {
      // Basic sanitization
      sanitized[key] = value
        .trim()
        .replace(/[<>]/g, '') // Remove basic HTML tags
        .substring(0, 1000); // Limit length
    } else if (typeof value === 'object' && value !== null) {
      // Recursively sanitize objects
      sanitized[key] = sanitizeSubmittedWork(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}

/**
 * Sanitize worker data
 * Clean and validate worker information
 */
function sanitizeWorkerData(workerData) {
  if (!workerData || typeof workerData !== 'object') {
    return {};
  }

  const sanitized = {};
  
  if (workerData.name) {
    sanitized.name = workerData.name.trim().substring(0, 50);
  }
  
  if (workerData.phone) {
    sanitized.phone = workerData.phone.replace(/\D/g, '').substring(0, 10);
  }
  
  if (workerData.email) {
    sanitized.email = workerData.email.trim().toLowerCase().substring(0, 100);
  }
  
  if (workerData.educationLevel) {
    const validLevels = ['10th', '12th', 'diploma', 'graduate', 'postgraduate', 'other'];
    sanitized.educationLevel = validLevels.includes(workerData.educationLevel) 
      ? workerData.educationLevel 
      : 'other';
  }
  
  if (workerData.availableHours) {
    const hours = parseInt(workerData.availableHours);
    sanitized.availableHours = (hours >= 1 && hours <= 12) ? hours : 3;
  }
  
  if (workerData.previousWork) {
    sanitized.previousWork = workerData.previousWork.trim().substring(0, 500);
  }
  
  return sanitized;
}

/**
 * Validate worker session (optional middleware)
 * Checks if worker session is valid for registered users
 */
const validateWorkerSession = async (req, res, next) => {
  try {
    const { workerId } = req.body;
    
    // Skip validation for trial/temp workers
    if (!workerId || workerId.startsWith('trial_') || workerId.startsWith('temp_')) {
      return next();
    }

    // Check if worker exists and is active
    const worker = await prisma.worker.findUnique({
      where: { id: workerId },
      select: {
        id: true,
        user: {
          select: {
            isActive: true
          }
        }
      }
    });

    if (!worker) {
      return res.status(404).json({
        success: false,
        error: 'Worker not found',
        message: 'Worker account not found'
      });
    }

    if (!worker.user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Account inactive',
        message: 'Worker account is not active'
      });
    }

    req.worker = worker;
    next();

  } catch (error) {
    console.error('Worker session validation error:', error);
    next(); // Continue without validation in case of error
  }
};

/**
 * Monitor trial task performance
 * Track submission metrics for system optimization
 */
const monitorTrialTaskPerformance = (req, res, next) => {
  const startTime = Date.now();
  
  // Monitor response time
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    console.log(`⏱️ Trial task operation: ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    
    // Log slow operations
    if (duration > 5000) {
      console.warn(`🐌 Slow trial task operation detected: ${duration}ms`);
    }
  });
  
  next();
};

module.exports = {
  trialTaskSubmissionLimiter,
  validateTrialSubmission,
  validateWorkerSession,
  monitorTrialTaskPerformance,
  sanitizeSubmittedWork,
  sanitizeWorkerData
};