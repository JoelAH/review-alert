#!/usr/bin/env node

/**
 * Gamification Data Migration Script
 * Migrates existing gamification data to new persistence format with validation and error recovery
 */

const { GamificationMigrationService } = require('../src/lib/services/gamificationMigration');
const mongoose = require('mongoose');

// Command line argument parsing
const args = process.argv.slice(2);
const options = {
  dryRun: args.includes('--dry-run'),
  validateOnly: args.includes('--validate-only'),
  batchSize: parseInt(args.find(arg => arg.startsWith('--batch-size='))?.split('=')[1]) || 100,
  backupBeforeMigration: !args.includes('--no-backup'),
  stats: args.includes('--stats'),
  help: args.includes('--help') || args.includes('-h')
};

function printHelp() {
  console.log(`
Gamification Data Migration Script

Usage: node scripts/migrate-gamification-persistence.js [options]

Options:
  --dry-run                 Perform a dry run without making changes
  --validate-only          Only validate data without migrating
  --batch-size=N           Process N users at a time (default: 100)
  --no-backup              Skip creating backups before migration
  --stats                  Show migration statistics only
  --help, -h               Show this help message

Examples:
  # Show migration statistics
  node scripts/migrate-gamification-persistence.js --stats

  # Validate all data without changes
  node scripts/migrate-gamification-persistence.js --validate-only

  # Perform a dry run
  node scripts/migrate-gamification-persistence.js --dry-run

  # Run actual migration with backups
  node scripts/migrate-gamification-persistence.js

  # Run migration without backups (faster)
  node scripts/migrate-gamification-persistence.js --no-backup

Environment Variables:
  DB_URI                   MongoDB connection string (required)
`);
}

async function connectToDatabase() {
  const dbUri = process.env.DB_URI;
  if (!dbUri) {
    console.error('Error: DB_URI environment variable is required');
    process.exit(1);
  }

  try {
    await mongoose.connect(dbUri);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }
}

async function showStats() {
  console.log('Gathering migration statistics...\n');
  
  try {
    const stats = await GamificationMigrationService.getMigrationStats();
    
    console.log('Migration Statistics:');
    console.log('====================');
    console.log(`Total users: ${stats.totalUsers}`);
    console.log(`Users with gamification data: ${stats.usersWithGamificationData}`);
    console.log(`Users with valid data: ${stats.usersWithValidData}`);
    console.log(`Users with invalid data: ${stats.usersWithInvalidData}`);
    
    if (stats.commonIssues.length > 0) {
      console.log('\nCommon Issues Found:');
      stats.commonIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue}`);
      });
    }
    
    if (stats.usersWithInvalidData > 0) {
      console.log('\nRecommendation: Run validation or dry-run first to see detailed issues');
    } else if (stats.usersWithGamificationData > 0) {
      console.log('\nAll sampled data appears valid. Ready for migration.');
    } else {
      console.log('\nNo users with gamification data found.');
    }
    
  } catch (error) {
    console.error('Failed to gather statistics:', error.message);
    process.exit(1);
  }
}

async function runMigration() {
  const { dryRun, validateOnly, batchSize, backupBeforeMigration } = options;
  
  let actionDescription;
  if (validateOnly) {
    actionDescription = 'Validating';
  } else if (dryRun) {
    actionDescription = 'Dry run migration';
  } else {
    actionDescription = 'Migrating';
  }
  
  console.log(`${actionDescription} gamification data...`);
  console.log(`Batch size: ${batchSize}`);
  if (!validateOnly) {
    console.log(`Backup before migration: ${backupBeforeMigration ? 'Yes' : 'No'}`);
  }
  console.log('');
  
  try {
    const startTime = Date.now();
    
    const result = await GamificationMigrationService.migrateAllUsers({
      dryRun,
      validateOnly,
      batchSize,
      backupBeforeMigration
    });
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\nMigration Results:');
    console.log('==================');
    console.log(`Total users processed: ${result.totalUsers}`);
    console.log(`Successful: ${result.migratedUsers}`);
    console.log(`Failed: ${result.failedUsers}`);
    console.log(`Duration: ${duration} seconds`);
    
    if (result.errors.length > 0) {
      console.log('\nErrors:');
      result.errors.forEach((error, index) => {
        console.log(`${index + 1}. User ${error.userId}: ${error.error}`);
      });
    }
    
    if (result.failedUsers > 0) {
      console.log('\nSome users failed migration. Check the errors above.');
      process.exit(1);
    } else if (result.totalUsers === 0) {
      console.log('\nNo users with gamification data found.');
    } else {
      console.log(`\n${actionDescription} completed successfully!`);
    }
    
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exit(1);
  }
}

async function main() {
  if (options.help) {
    printHelp();
    return;
  }
  
  console.log('Gamification Data Migration Tool');
  console.log('================================\n');
  
  await connectToDatabase();
  
  try {
    if (options.stats) {
      await showStats();
    } else {
      await runMigration();
    }
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\nReceived SIGINT, shutting down gracefully...');
  await mongoose.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\nReceived SIGTERM, shutting down gracefully...');
  await mongoose.disconnect();
  process.exit(0);
});

// Run the script
main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});