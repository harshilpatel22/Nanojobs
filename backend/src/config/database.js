const { PrismaClient } = require('@prisma/client');

/**
 * Database Configuration and Connection
 * Manages PostgreSQL connection via Prisma ORM
 */

// Create Prisma client instance
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  errorFormat: 'colorless',
});

/**
 * Initialize database connection
 */
async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Test the connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Database query test passed');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

/**
 * Gracefully disconnect from database
 */
async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    console.log('✅ Database disconnected gracefully');
  } catch (error) {
    console.error('❌ Database disconnection error:', error.message);
  }
}

/**
 * Health check for database
 */
async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error.message, 
      timestamp: new Date().toISOString() 
    };
  }
}

/**
 * Database transaction wrapper
 */
async function withTransaction(callback) {
  return await prisma.$transaction(callback);
}

/**
 * Seed database with initial data
 */
async function seedDatabase() {
  try {
    console.log('🌱 Seeding database...');

    // Create system config entries
    const configs = [
      {
        key: 'badge_bronze_min_score',
        value: '0',
        description: 'Minimum score for Bronze badge'
      },
      {
        key: 'badge_silver_min_score', 
        value: '15',
        description: 'Minimum score for Silver badge'
      },
      {
        key: 'badge_gold_min_score',
        value: '25',
        description: 'Minimum score for Gold badge'
      },
      {
        key: 'badge_platinum_min_score',
        value: '35',
        description: 'Minimum score for Platinum badge'
      },
      {
        key: 'quiz_max_score',
        value: '40',
        description: 'Maximum possible quiz score'
      }
    ];

    for (const config of configs) {
      await prisma.systemConfig.upsert({
        where: { key: config.key },
        update: { value: config.value, description: config.description },
        create: config
      });
    }

    console.log('✅ Database seeded successfully');
  } catch (error) {
    console.error('❌ Database seeding failed:', error.message);
    throw error;
  }
}

/**
 * Clean up expired sessions
 */
async function cleanupExpiredSessions() {
  try {
    const result = await prisma.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { isActive: false }
        ]
      }
    });
    
    console.log(`🧹 Cleaned up ${result.count} expired sessions`);
    return result.count;
  } catch (error) {
    console.error('❌ Session cleanup failed:', error.message);
    return 0;
  }
}

/**
 * Get database statistics
 */
async function getDatabaseStats() {
  try {
    const stats = await prisma.$transaction([
      prisma.user.count(),
      prisma.worker.count(),
      prisma.employer.count(),
      prisma.task.count(),
      prisma.taskApplication.count(),
      prisma.session.count({ where: { isActive: true } })
    ]);

    return {
      users: stats[0],
      workers: stats[1],
      employers: stats[2],
      tasks: stats[3],
      applications: stats[4],
      activeSessions: stats[5],
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Failed to get database stats:', error.message);
    return null;
  }
}

// Handle process termination
process.on('beforeExit', async () => {
  await disconnectDatabase();
});

process.on('SIGINT', async () => {
  console.log('\n🔄 Received SIGINT, shutting down gracefully...');
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Received SIGTERM, shutting down gracefully...');
  await disconnectDatabase();
  process.exit(0);
});

module.exports = {
  prisma,
  connectDatabase,
  disconnectDatabase,
  checkDatabaseHealth,
  withTransaction,
  seedDatabase,
  cleanupExpiredSessions,
  getDatabaseStats
};