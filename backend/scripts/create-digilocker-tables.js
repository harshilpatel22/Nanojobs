/**
 * Create DigiLocker verification tables
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createDigiLockerTables() {
  console.log('🔄 Creating DigiLocker verification tables...');

  try {
    // Create verification sessions table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS verification_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        user_type TEXT DEFAULT 'worker',
        state TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        UNIQUE(user_id)
      )
    `;
    console.log('✅ Created verification_sessions table');

    // Create digilocker verifications table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS digilocker_verifications (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        aadhaar_number TEXT,
        verified_name TEXT,
        verified_dob TEXT,
        verified_address TEXT,
        is_verified BOOLEAN DEFAULT false,
        verified_at TIMESTAMP,
        verification_method TEXT DEFAULT 'digilocker',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log('✅ Created digilocker_verifications table');

    // Create index for faster lookups
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_verification_sessions_user_id 
      ON verification_sessions(user_id)
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_digilocker_verifications_user_id 
      ON digilocker_verifications(user_id)
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS idx_digilocker_verifications_aadhaar 
      ON digilocker_verifications(aadhaar_number)
    `;
    
    console.log('✅ Created indexes');

    console.log('✅ DigiLocker tables created successfully!');

  } catch (error) {
    console.error('❌ Failed to create DigiLocker tables:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  createDigiLockerTables()
    .catch((error) => {
      console.error('Table creation failed:', error);
      process.exit(1);
    });
}

module.exports = { createDigiLockerTables };