#!/bin/bash
set -e

echo "🔨 Starting build process..."

# Always generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Only run migrations if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
  echo "🔄 Running database migrations..."
  npx prisma migrate deploy || {
    echo "⚠️  Migration failed, but continuing with build..."
  }
else
  echo "⚠️  DATABASE_URL not set - skipping migrations"
  echo "   Set DATABASE_URL in Vercel dashboard under Settings > Environment Variables"
fi

# Build Next.js
echo "🏗️  Building Next.js application..."
npx next build

echo "✅ Build completed successfully!"
