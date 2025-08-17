/**
 * Migration Script: Revert to Single Badge System
 * Removes CategoryBadge table and reverts to single badge per worker
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function revertToSingleBadge() {
  console.log('🔄 Reverting to single badge system...');

  try {
    // 1. Add back badge columns to workers table if they don't exist
    console.log('🔧 Adding badge columns back to workers table...');
    try {
      await prisma.$executeRaw`
        ALTER TABLE workers 
        ADD COLUMN IF NOT EXISTS badge TEXT DEFAULT 'BRONZE',
        ADD COLUMN IF NOT EXISTS "badgeReason" TEXT
      `;
      console.log('✅ Added badge columns');
    } catch (error) {
      console.log('⚠️ Badge columns might already exist:', error.message);
    }

    // 2. Update any workers who don't have a badge
    console.log('🎖️ Setting default badges for workers...');
    await prisma.$executeRaw`
      UPDATE workers 
      SET badge = 'BRONZE'
      WHERE badge IS NULL
    `;
    
    // Handle empty string badges separately
    await prisma.$executeRaw`
      UPDATE workers 
      SET badge = 'BRONZE'
      WHERE badge = ''
    `;

    // 3. Drop CategoryBadge table if it exists
    console.log('🗑️ Removing CategoryBadge table...');
    try {
      await prisma.$executeRaw`DROP TABLE IF EXISTS "category_badges" CASCADE`;
      console.log('✅ Removed CategoryBadge table');
    } catch (error) {
      console.log('⚠️ CategoryBadge table might not exist:', error.message);
    }

    // 4. Remove badge category columns from BronzeTask
    console.log('🔧 Cleaning up BronzeTask table...');
    try {
      await prisma.$executeRaw`
        ALTER TABLE "bronze_tasks" 
        DROP COLUMN IF EXISTS "canEarnBadge",
        DROP COLUMN IF EXISTS "badgeCategory"
      `;
      console.log('✅ Cleaned up BronzeTask table');
    } catch (error) {
      console.log('⚠️ Columns might not exist:', error.message);
    }

    console.log('✅ Successfully reverted to single badge system!');
    console.log('\n📋 Changes made:');
    console.log('- Added badge and badgeReason columns back to Worker table');
    console.log('- Removed CategoryBadge table');
    console.log('- Cleaned up BronzeTask badge category fields');
    console.log('- Set default BRONZE badge for all workers');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if called directly
if (require.main === module) {
  revertToSingleBadge()
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { revertToSingleBadge };