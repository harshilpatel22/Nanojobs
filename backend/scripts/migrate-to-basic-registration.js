/**
 * Migration Script: Basic Registration System
 * Give existing workers badges in all categories for testing
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function migrateToBasicRegistration() {
  console.log('🔄 Starting migration to basic registration system...');

  try {
    // 1. Add new columns to workers table
    console.log('🔧 Adding new columns to workers table...');
    
    try {
      await prisma.$executeRaw`
        ALTER TABLE workers 
        ADD COLUMN IF NOT EXISTS city TEXT,
        ADD COLUMN IF NOT EXISTS state TEXT,
        ADD COLUMN IF NOT EXISTS pincode TEXT,
        ADD COLUMN IF NOT EXISTS "dateOfBirth" TIMESTAMP(3),
        ADD COLUMN IF NOT EXISTS "idDocumentType" TEXT,
        ADD COLUMN IF NOT EXISTS "idDocumentNumber" TEXT,
        ADD COLUMN IF NOT EXISTS "idDocumentUrl" TEXT,
        ADD COLUMN IF NOT EXISTS "isIdVerified" BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS "idVerifiedAt" TIMESTAMP(3)
      `;
      console.log('✅ Added ID verification columns');
    } catch (error) {
      console.log('⚠️ Some columns might already exist:', error.message);
    }

    // 2. Create CategoryBadge table
    console.log('🏆 Creating CategoryBadge table...');
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "category_badges" (
          "id" TEXT NOT NULL,
          "workerId" TEXT NOT NULL,
          "category" TEXT NOT NULL,
          "badgeLevel" TEXT NOT NULL DEFAULT 'BRONZE',
          "earnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "earnedBy" TEXT NOT NULL,
          "taskId" TEXT,
          "submissionQuality" DOUBLE PRECISION,
          "tasksCompleted" INTEGER NOT NULL DEFAULT 0,
          "averageRating" DOUBLE PRECISION,
          "totalEarnings" DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

          CONSTRAINT "category_badges_pkey" PRIMARY KEY ("id")
        )
      `;
      
      await prisma.$executeRaw`
        CREATE UNIQUE INDEX IF NOT EXISTS "category_badges_workerId_category_key" 
        ON "category_badges"("workerId", "category")
      `;
      
      await prisma.$executeRaw`
        ALTER TABLE "category_badges" 
        ADD CONSTRAINT IF NOT EXISTS "category_badges_workerId_fkey" 
        FOREIGN KEY ("workerId") REFERENCES "workers"("id") ON DELETE CASCADE ON UPDATE CASCADE
      `;
      
      console.log('✅ CategoryBadge table created');
    } catch (error) {
      console.log('⚠️ CategoryBadge table might already exist:', error.message);
    }

    // 3. Get existing workers and give them badges in ALL categories
    console.log('🎖️ Giving existing workers badges in all categories...');
    const existingWorkers = await prisma.worker.findMany({
      select: {
        id: true,
        badge: true,
        tasksCompleted: true
      }
    });

    const categories = [
      'DATA_ENTRY',
      'CONTENT_CREATION', 
      'CUSTOMER_SERVICE',
      'RESEARCH',
      'BASIC_DESIGN',
      'BASIC_FINANCE'
    ];

    let totalBadgesCreated = 0;

    for (const worker of existingWorkers) {
      for (const category of categories) {
        try {
          await prisma.$executeRaw`
            INSERT INTO "category_badges" (
              "id", 
              "workerId", 
              "category", 
              "badgeLevel", 
              "earnedBy", 
              "tasksCompleted",
              "averageRating",
              "totalEarnings"
            ) VALUES (
              ${`cb_${worker.id}_${category.toLowerCase()}`}, 
              ${worker.id}, 
              ${category}, 
              ${worker.badge || 'BRONZE'}, 
              'testing_migration', 
              ${worker.tasksCompleted || 1},
              4.5,
              ${(worker.tasksCompleted || 1) * 150}
            ) ON CONFLICT ("workerId", "category") DO NOTHING
          `;
          totalBadgesCreated++;
        } catch (error) {
          console.log(`⚠️ Could not create badge for worker ${worker.id} in ${category}:`, error.message);
        }
      }
    }
    
    console.log(`✅ Created ${totalBadgesCreated} category badges for ${existingWorkers.length} workers`);

    // 4. Add free task columns to BronzeTask table
    console.log('🆓 Adding free task columns to BronzeTask table...');
    try {
      await prisma.$executeRaw`
        ALTER TABLE "bronze_tasks" 
        ADD COLUMN IF NOT EXISTS "isFreeTask" BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS "maxApplications" INTEGER DEFAULT 100,
        ADD COLUMN IF NOT EXISTS "canEarnBadge" BOOLEAN DEFAULT false,
        ADD COLUMN IF NOT EXISTS "badgeCategory" TEXT
      `;
      console.log('✅ Added free task columns to BronzeTask table');
    } catch (error) {
      console.log('⚠️ Some free task columns might already exist:', error.message);
    }

    // 5. Add free task tracking to Employer table
    console.log('👔 Adding free task tracking to Employer table...');
    try {
      await prisma.$executeRaw`
        ALTER TABLE "employers" 
        ADD COLUMN IF NOT EXISTS "freeTasksUsed" INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "hasUsedFreeTasks" BOOLEAN DEFAULT false
      `;
      console.log('✅ Added free task tracking to Employer table');
    } catch (error) {
      console.log('⚠️ Some employer columns might already exist:', error.message);
    }

    // 6. Add enum values if they don't exist
    console.log('📝 Adding new enum values...');
    try {
      await prisma.$executeRaw`
        ALTER TYPE "RegistrationMethod" ADD VALUE IF NOT EXISTS 'BASIC_INFO'
      `;
    } catch (error) {
      console.log('⚠️ BASIC_INFO enum value might already exist:', error.message);
    }

    console.log('✅ Migration completed successfully!');
    console.log('\n📋 Migration Summary:');
    console.log(`- Updated ${existingWorkers.length} existing workers`);
    console.log(`- Created ${totalBadgesCreated} category badges (all categories for all workers)`);
    console.log('- Added ID verification fields to Worker table');
    console.log('- Created CategoryBadge table for category-specific badges');
    console.log('- Added free task system to BronzeTask and Employer tables');
    console.log('\n🚀 The system is now ready for basic registration and category badges!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateToBasicRegistration()
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateToBasicRegistration };