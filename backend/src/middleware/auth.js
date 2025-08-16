// Create this file: backend/src/middleware/auth.js

const jwt = require('jsonwebtoken');
const { prisma } = require('../config/database');

/**
 * JWT Authentication Middleware
 * Works with the new MSG91-based authentication system
 */

/**
 * Verify JWT token and authenticate user
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied',
        message: 'Authentication token required'
      });
    }
    
    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      let message = 'Invalid authentication token';
      if (jwtError.name === 'TokenExpiredError') {
        message = 'Authentication token has expired';
      } else if (jwtError.name === 'JsonWebTokenError') {
        message = 'Invalid authentication token';
      }
      
      return res.status(401).json({
        success: false,
        error: 'Token verification failed',
        message: message
      });
    }
    
    // Check if session exists and is active
    const session = await prisma.session.findFirst({
      where: {
        token: token,
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
      return res.status(401).json({
        success: false,
        error: 'Invalid session',
        message: 'Session expired or not found. Please log in again.'
      });
    }
    
    if (!session.user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Account disabled',
        message: 'Your account has been disabled'
      });
    }
    
    // Update last used timestamp (async, don't wait)
    prisma.session.update({
      where: { id: session.id },
      data: { lastUsed: new Date() }
    }).catch(error => {
      console.warn('⚠️ Failed to update session last used:', error);
    });
    
    // Attach user data to request
    req.user = session.user;
    req.userType = decoded.userType;
    req.sessionId = session.id;
    req.sessionToken = token;
    
    // Attach specific user data based on type
    if (decoded.userType === 'worker' && session.user.worker) {
      req.worker = session.user.worker;
      req.workerId = session.user.worker.id;
      req.userId = session.user.worker.id; // For backward compatibility
    } else if (decoded.userType === 'employer' && session.user.employer) {
      req.employer = session.user.employer;
      req.employerId = session.user.employer.id;
      req.userId = session.user.employer.id; // For backward compatibility
    } else {
      // Fallback for cases where worker/employer relation doesn't exist
      req.userId = decoded.userId;
    }
    
    next();
    
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed',
      message: 'Unable to authenticate request'
    });
  }
};

/**
 * Require specific user type
 */
const requireUserType = (requiredType) => {
  return (req, res, next) => {
    if (!req.userType) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please log in to access this resource'
      });
    }
    
    if (req.userType !== requiredType) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: `This resource requires ${requiredType} access. You are logged in as ${req.userType}.`
      });
    }
    
    next();
  };
};

/**
 * Require worker authentication
 */
const requireWorker = (req, res, next) => {
  if (!req.worker || req.userType !== 'worker') {
    return res.status(403).json({
      success: false,
      error: 'Worker access required',
      message: 'This resource is only accessible to workers'
    });
  }
  next();
};

/**
 * Require employer authentication
 */
const requireEmployer = (req, res, next) => {
  if (!req.employer || req.userType !== 'employer') {
    return res.status(403).json({
      success: false,
      error: 'Employer access required',
      message: 'This resource is only accessible to employers'
    });
  }
  next();
};

/**
 * Optional authentication (doesn't fail if no token)
 * Useful for endpoints that work for both authenticated and anonymous users
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      // No token provided, continue without authentication
      req.user = null;
      req.userType = null;
      req.authenticated = false;
      return next();
    }
    
    // Try to verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      // Invalid token, continue without authentication
      req.user = null;
      req.userType = null;
      req.authenticated = false;
      return next();
    }
    
    // Check session
    const session = await prisma.session.findFirst({
      where: {
        token: token,
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
    
    if (session && session.user.isActive) {
      // Valid session, attach user data
      req.user = session.user;
      req.userType = decoded.userType;
      req.sessionId = session.id;
      req.authenticated = true;
      
      if (decoded.userType === 'worker' && session.user.worker) {
        req.worker = session.user.worker;
        req.workerId = session.user.worker.id;
      } else if (decoded.userType === 'employer' && session.user.employer) {
        req.employer = session.user.employer;
        req.employerId = session.user.employer.id;
      }
      
      // Update last used (async)
      prisma.session.update({
        where: { id: session.id },
        data: { lastUsed: new Date() }
      }).catch(error => {
        console.warn('⚠️ Failed to update session last used:', error);
      });
    } else {
      // Invalid session, continue without authentication
      req.user = null;
      req.userType = null;
      req.authenticated = false;
    }
    
    next();
    
  } catch (error) {
    console.error('❌ Optional auth error:', error);
    // Don't fail on optional auth errors
    req.user = null;
    req.userType = null;
    req.authenticated = false;
    next();
  }
};

/**
 * Check if user owns a resource (for user-specific data access)
 */
const requireResourceOwner = (userIdParam = 'id') => {
  return (req, res, next) => {
    const resourceUserId = req.params[userIdParam];
    
    if (!req.userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please log in to access this resource'
      });
    }
    
    if (req.userId !== resourceUserId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only access your own resources'
      });
    }
    
    next();
  };
};

/**
 * Rate limiting middleware (basic implementation)
 */
const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get existing requests for this IP
    let userRequests = requests.get(key) || [];
    
    // Filter out old requests
    userRequests = userRequests.filter(time => time > windowStart);
    
    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    // Add current request
    userRequests.push(now);
    requests.set(key, userRequests);
    
    next();
  };
};

module.exports = {
  authenticateToken,
  requireUserType,
  requireWorker,
  requireEmployer,
  optionalAuth,
  requireResourceOwner,
  rateLimit
};