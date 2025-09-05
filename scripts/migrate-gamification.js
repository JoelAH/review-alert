#!/usr/bin/env node

/**
 * Migration runner script for gamification data
 * Usage: node scripts/migrate-gamification.js [--rollback]
 */

// Register TypeScript compiler for Node.js
//require('ts-node/register');

const { migrateGamificationData, rollbackGamificationData } = require('../src/lib/db/migrations/001-add-gamification-data.ts');

async function runMigration() {
  const isRollback = process.argv.includes('--rollback');
  
  try {
    console.log(`Starting gamification migration ${isRollback ? '(rollback)' : ''}...`);
    
    const result = isRollback 
      ? await rollbackGamificationData()
      : await migrateGamificationData();
    
    if (result.success) {
      console.log(`Migration completed successfully. ${result.usersUpdated} users updated.`);
      process.exit(0);
    } else {
      console.error('Migration failed');
      process.exit(1);
    }
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

runMigration();