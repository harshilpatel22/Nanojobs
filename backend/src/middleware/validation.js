/**
 * Validation Middleware
 * Handles express-validator validation errors
 */

const { validationResult } = require('express-validator');

/**
 * Handle validation errors from express-validator
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: 'Please check your input and try again',
      details: errorMessages
    });
  }
  
  next();
};

module.exports = {
  handleValidationErrors
};