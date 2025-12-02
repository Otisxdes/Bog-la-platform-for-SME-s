#!/usr/bin/env node
/**
 * Script to resolve failed migrations in production
 * Marks the old SQLite migration as rolled back so new migrations can be applied
 */

const { execSync } = require('child_process');

const failedMigrationName = '20251130160617_add_multi_size_support';

try {
  console.log(`Attempting to resolve failed migration: ${failedMigrationName}`);
  
  // Try to mark the failed migration as rolled back
  // This will only work if the migration is in a failed state
  execSync(
    `npx prisma migrate resolve --rolled-back ${failedMigrationName}`,
    { stdio: 'inherit' }
  );
  
  console.log('✅ Successfully resolved failed migration');
} catch (error) {
  // If the migration doesn't exist in the database or is already resolved, that's okay
  if (error.message.includes('not found') || error.message.includes('does not exist')) {
    console.log('ℹ️  Migration not found in database (may have been cleaned up already)');
    process.exit(0);
  } else {
    console.log('⚠️  Could not resolve migration (may already be resolved):', error.message);
    // Don't fail the build if we can't resolve - let migrate deploy handle it
    process.exit(0);
  }
}

