/**
 * NanoJobs Enhanced Server - Production Ready
 * 
 * Features added in this version:
 * - Enhanced Trial Task System integration
 * - Production-ready error handling
 * - Comprehensive logging
 * - Health monitoring
 * - Performance optimizations
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Database
const { prisma } = require('./src/config/database');

// Routes
const authRoutes = require('./src/routes/auth');
const workerRoutes = require('./src/routes/workers');
const employerRoutes = require('./src/routes/employers');
const taskRoutes = require('./src/routes/tasks');
const paymentRoutes = require('./src/routes/payments');
const aiRoutes = require('./src/routes/ai');
const bronzeTaskRoutes = require('./src/routes/bronzeTaskRoutes');
// NEW: Enhanced Trial Task Routes
const trialTaskRoutes = require('./src/routes/trials');
// NEW: Rating System Routes
const ratingRoutes = require('./src/routes/ratings');

// NEW: Task Submission Routes
const taskSubmissionRoutes = require('./src/routes/taskSubmissions');

const app = express();
const PORT = process.env.PORT || 5001;

/**
 * SECURITY MIDDLEWARE
 */
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false // Disable for development
}));

/**
 * CORS CONFIGURATION
 */
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

/**
 * RATE LIMITING
 */
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests',
    message: 'Please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

/**
 * BODY PARSING MIDDLEWARE
 */
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * REQUEST LOGGING MIDDLEWARE
 */
app.use((req, res, next) => {
  const start = Date.now();
  
  // Add request ID for tracking
  req.requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.startTime = start;
  
  console.log(`🔄 [${req.requestId}] ${req.method} ${req.url} - Started`);
  
  // Log request completion
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode >= 400 ? '❌' : '✅';
    console.log(`${status} [${req.requestId}] ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
});

/**
 * HEALTH CHECK ENDPOINTS
 */
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Get system stats
    const [workerCount, employerCount, taskCount] = await Promise.all([
      prisma.worker.count(),
      prisma.employer.count(),
      prisma.trialTask.count({ where: { isActive: true } })
    ]);
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      database: 'connected',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      system: {
        workers: workerCount,
        employers: employerCount,
        activeTasks: taskCount
      },
      features: {
        enhancedTrialTasks: true,
        paymentIntegration: true,
        badgeProgression: true,
        realTimeEvaluation: true
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: 'Database connection failed',
      timestamp: new Date().toISOString()
    });
  }
});

// Quick ping endpoint
app.get('/ping', (req, res) => {
  res.json({ 
    success: true, 
    message: 'pong', 
    timestamp: new Date().toISOString() 
  });
});

/**
 * API ROUTES REGISTRATION
 */
console.log('🔧 Registering API routes...');

// Core authentication
app.use('/api/auth', authRoutes);
console.log('✅ Auth routes registered');

// User management
app.use('/api/workers', workerRoutes);
console.log('✅ Worker routes registered');

app.use('/api/employers', employerRoutes);
console.log('✅ Employer routes registered');

// Task management
app.use('/api/tasks', taskRoutes);
console.log('✅ Task routes registered');

// Payment processing
app.use('/api/payments', paymentRoutes);
console.log('✅ Payment routes registered');

// AI services
app.use('/api/ai', aiRoutes);
console.log('✅ AI routes registered');

// NEW: Enhanced Trial Task System
app.use('/api/trial-tasks', trialTaskRoutes);
console.log('✅ Enhanced Trial Task routes registered');

app.use('/api/bronze-tasks', bronzeTaskRoutes);
console.log('✅ Bronze Task routes registered');

// NEW: Rating System
app.use('/api/ratings', ratingRoutes);
console.log('✅ Rating routes registered');

// NEW: Task Submissions
app.use('/api/task-submissions', taskSubmissionRoutes);
console.log('✅ Task Submission routes registered');

/**
 * STATIC FILE SERVING
 */
app.use('/uploads', express.static('uploads', {
  maxAge: '1d',
  etag: true
}));

/**
 * API DOCUMENTATION ENDPOINT
 */
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'NanoJobs API v2.0 - Enhanced Trial Task System',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/auth',
      workers: '/api/workers',
      employers: '/api/employers', 
      tasks: '/api/tasks',
      payments: '/api/payments',
      ai: '/api/ai',
      trialTasks: '/api/trial-tasks'
    },
    newFeatures: {
      enhancedTrialTasks: {
        description: 'Production-ready skill verification microtask system',
        endpoints: [
          'GET /api/trial-tasks - Get available trial tasks',
          'POST /api/trial-tasks/:taskId/submit - Submit trial task work',
          'GET /api/trial-tasks/:taskId/feedback - Get real-time feedback',
          'GET /api/trial-tasks/submissions/:workerId - Get submissions',
          'GET /api/trial-tasks/analytics - Get system analytics'
        ],
        features: [
          'Real-time evaluation with detailed feedback',
          'Payment integration (₹50-100 per task)', 
          'Badge progression based on performance',
          'Enhanced analytics and progress tracking',
          'Performance-based recommendations'
        ]
      }
    },
    documentation: '/api/docs',
    health: '/health'
  });
});

/**
 * 404 HANDLER FOR API ROUTES
 */
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found',
    message: `The endpoint ${req.method} ${req.originalUrl} does not exist`,
    availableEndpoints: [
      '/api/auth',
      '/api/workers', 
      '/api/employers',
      '/api/tasks',
      '/api/payments',
      '/api/ai',
      '/api/trial-tasks'
    ]
  });
});

/**
 * GLOBAL ERROR HANDLER
 */
app.use((error, req, res, next) => {
  console.error(`❌ [${req.requestId || 'unknown'}] Global error:`, error);
  
  // Handle different error types
  let status = error.status || error.statusCode || 500;
  let message = error.message || 'Internal server error';
  
  // Prisma errors
  if (error.code === 'P2002') {
    status = 409;
    message = 'A record with this information already exists';
  } else if (error.code === 'P2025') {
    status = 404;
    message = 'Record not found';
  } else if (error.code?.startsWith('P')) {
    status = 400;
    message = 'Database operation failed';
  }
  
  // Validation errors
  if (error.name === 'ValidationError') {
    status = 400;
    message = 'Validation failed';
  }
  
  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid token';
  } else if (error.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token expired';
  }
  
  res.status(status).json({
    success: false,
    error: 'Server error',
    message: process.env.NODE_ENV === 'production' ? 'An error occurred' : message,
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { 
      stack: error.stack,
      details: error 
    })
  });
});

/**
 * GRACEFUL SHUTDOWN HANDLER
 */
process.on('SIGTERM', async () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  
  // Close database connections
  await prisma.$disconnect();
  console.log('📊 Database connections closed');
  
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 SIGINT received, shutting down gracefully...');
  
  // Close database connections
  await prisma.$disconnect();
  console.log('📊 Database connections closed');
  
  process.exit(0);
});

/**
 * START SERVER
 */
const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('📊 Database connected successfully');
    
    // Check if trial tasks exist, seed if needed
    const trialTaskCount = await prisma.trialTask.count();
    if (trialTaskCount === 0) {
      console.log('🌱 No trial tasks found, seeding database...');
      const trialTaskService = require('./src/services/enhancedTrialTaskService');
      await trialTaskService.seedTrialTasks();
      console.log('✅ Trial tasks seeded successfully');
    } else {
      console.log(`📋 Found ${trialTaskCount} trial tasks in database`);
    }
    
    // Start the server
    app.listen(PORT, () => {
      console.log('🚀 NanoJobs Enhanced Server Started!');
      console.log(`📡 Server running on http://localhost:${PORT}`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📝 API Documentation: http://localhost:${PORT}/api`);
      console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
      console.log('');
      console.log('🎯 Enhanced Features Available:');
      console.log('   ✅ Trial Task System - Skill verification microtasks');
      console.log('   ✅ Real-time Evaluation - Instant feedback and scoring');
      console.log('   ✅ Payment Integration - ₹50-100 per trial task');
      console.log('   ✅ Badge Progression - Performance-based advancement');
      console.log('   ✅ Analytics Dashboard - Comprehensive progress tracking');
      console.log('');
      console.log('🎉 Ready to accept connections!');
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;