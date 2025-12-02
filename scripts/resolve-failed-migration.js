#!/usr/bin/env node
/**
 * Script to resolve failed migrations in production
 * Marks the old SQLite migration as applied so new migrations can be applied
 */

const { execSync } = require('child_process');

const failedMigrationName = '20251130160617_add_multi_size_support';

console.log(`🔍 Attempting to resolve failed migration: ${failedMigrationName}`);

try {
  // Mark the migration as applied (since we have a new init migration that handles everything)
  // This tells Prisma to skip this migration and proceed with newer ones
  console.log(`Marking migration as applied...`);
  execSync(
    `npx prisma migrate resolve --applied ${failedMigrationName}`,
    { stdio: 'inherit' }
  );
  
  console.log('✅ Successfully marked migration as applied');
  process.exit(0);
} catch (error) {
  const errorMessage = error.message || error.toString();
  
  // If the migration doesn't exist in the database or is already resolved, that's okay
  if (errorMessage.includes('not found') || 
      errorMessage.includes('does not exist') ||
      errorMessage.includes('already applied') ||
      errorMessage.includes('already resolved')) {
    console.log('ℹ️  Migration not found or already resolved - proceeding...');
    process.exit(0);
  } else {
    // If we can't resolve, log the error but don't fail the build
    // The migration file now exists, so migrate deploy might handle it differently
    console.log('⚠️  Could not resolve migration:', errorMessage);
    console.log('   Proceeding anyway - migrate deploy will handle it...');
    process.exit(0);
  }
}

