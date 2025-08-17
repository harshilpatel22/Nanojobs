/**
 * Simple revert to single badge system
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function simpleRevert() {
  console.log('🔄 Simple revert to single badge system...');

  try {
    // First, let's see what workers we have
    const workers = await prisma.worker.findMany({
      select: { id: true, badge: true }
    });
    
    console.log(`Found ${workers.length} workers`);
    
    // Update workers one by one to ensure they have valid badges
    for (const worker of workers) {
      try {
        await prisma.worker.update({
          where: { id: worker.id },
          data: {
            badge: worker.badge || 'BRONZE' // Use existing badge or default to BRONZE
          }
        });
      } catch (error) {
        console.log(`Updating worker ${worker.id} to BRONZE badge`);
        await prisma.worker.update({
          where: { id: worker.id },
          data: {
            badge: 'BRONZE'
          }
        });
      }
    }

    // Drop CategoryBadge table if it exists
    try {
      await prisma.$executeRaw`DROP TABLE IF EXISTS "category_badges" CASCADE`;
      console.log('✅ Removed CategoryBadge table');
    } catch (error) {
      console.log('⚠️ CategoryBadge table might not exist:', error.message);
    }

    console.log('✅ Successfully reverted to single badge system!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if called directly
if (require.main === module) {
  simpleRevert()
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { simpleRevert };