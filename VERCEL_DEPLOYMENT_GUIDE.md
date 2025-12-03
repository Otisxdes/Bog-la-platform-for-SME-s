# Vercel Deployment Guide for Bog'la

## What Was Fixed

The `routes-manifest.json` error was caused by a failing install command that prevented the Next.js build from running. Here's what was fixed:

### Changes Made:

1. **Simplified `vercel.json`**
   - Removed complex `installCommand` with migration workarounds
   - Now uses standard Next.js framework detection

2. **Updated `package.json` scripts**
   - Added `postinstall` script to automatically run `prisma generate`
   - Updated `build` script to run migrations before building: `prisma generate && prisma migrate deploy && next build`

3. **Cleaned up migrations**
   - Removed old SQLite migration (`20251130160617_add_multi_size_support`)
   - Removed workaround script (`scripts/resolve-failed-migration.js`)
   - Only one clean PostgreSQL migration remains

4. **Updated `.env.example`**
   - Changed from SQLite to PostgreSQL examples
   - Added instructions for different PostgreSQL providers

## Deployment Steps

### Step 1: Set Up PostgreSQL Database

Choose one of these options:

#### Option A: Vercel Postgres (Recommended)
```bash
# In your Vercel project dashboard:
1. Go to Storage tab
2. Click "Create Database"
3. Select "Postgres"
4. Copy the connection string
```

#### Option B: Supabase (Free tier)
```bash
1. Go to https://supabase.com
2. Create a new project
3. Get connection string from Settings > Database
4. Format: postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
```

#### Option C: Neon (Serverless Postgres)
```bash
1. Go to https://neon.tech
2. Create a new project
3. Copy the connection string
```

### Step 2: Configure Vercel Environment Variable

In your Vercel project dashboard:

1. Go to **Settings** > **Environment Variables**
2. Add a new variable:
   - **Name**: `DATABASE_URL`
   - **Value**: Your PostgreSQL connection string
   - **Environments**: Production, Preview, Development (check all)
3. Click **Save**

### Step 3: Deploy

#### Option A: Git Push (Recommended)
```bash
git add .
git commit -m "Fix Vercel deployment configuration"
git push
```

Vercel will automatically deploy your changes.

#### Option B: Manual Deploy via Vercel CLI
```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Deploy
vercel --prod
```

### Step 4: Verify Deployment

After deployment:

1. Check build logs in Vercel dashboard
2. Look for successful messages:
   - ✅ `Prisma schema loaded`
   - ✅ `Database migrations completed`
   - ✅ `Build completed successfully`

3. Test your deployment:
   - Visit your Vercel URL
   - Try accessing `/ru/login` (seller login)
   - Create a test checkout link

## How the Build Process Works Now

```mermaid
graph TD
    A[npm install] --> B[postinstall: prisma generate]
    B --> C[npm run build]
    C --> D[prisma generate]
    D --> E[prisma migrate deploy]
    E --> F[next build]
    F --> G[Deployment Success]
```

### What Happens During Build:

1. **Install Phase**:
   - `npm install` runs
   - `postinstall` automatically runs `prisma generate`
   - Prisma Client is created

2. **Build Phase**:
   - `npm run build` is triggered by Vercel
   - `prisma generate` ensures client is up-to-date
   - `prisma migrate deploy` applies database migrations
   - `next build` creates the production build
   - `routes-manifest.json` is generated ✅

## Troubleshooting

### Build Still Fails?

1. **Check DATABASE_URL**:
   ```bash
   # In Vercel dashboard, verify the environment variable is set correctly
   # Make sure there are no extra spaces or quotes
   ```

2. **Check Build Logs**:
   - Go to Vercel Dashboard > Deployments > Click on failed deployment
   - Look for error messages in the build logs
   - Common issues:
     - Database connection refused (check firewall/IP allowlist)
     - Invalid connection string format
     - Missing DATABASE_URL environment variable

3. **Database Connection Issues**:
   - Ensure your PostgreSQL database allows connections from Vercel
   - Most cloud providers have IP allowlists - add `0.0.0.0/0` to allow all (or Vercel's IPs)
   - For Supabase: Should work by default
   - For Neon: Should work by default
   - For Vercel Postgres: Should work by default

4. **Migration Issues**:
   - If you get migration errors, you might need to reset your database
   - Delete all tables and run migrations again
   - Or create a fresh database and update DATABASE_URL

### Local Development

Your local `.env` still points to SQLite:
```env
DATABASE_URL="file:./dev.db"
```

To use PostgreSQL locally:

1. Install PostgreSQL locally or use Docker:
   ```bash
   docker run --name bogla-postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres
   ```

2. Update your `.env`:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/bogla_dev?schema=public"
   ```

3. Run migrations:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

## Next Steps After Successful Deployment

1. **Seed Your Production Database**:
   ```bash
   # Option 1: Use Vercel CLI to run seed script
   vercel env pull .env.production
   DATABASE_URL=$(grep DATABASE_URL .env.production | cut -d '=' -f2) npm run db:seed

   # Option 2: Manually create a seller via SQL or Prisma Studio
   npx prisma studio --schema=./prisma/schema.prisma
   ```

2. **Test the Application**:
   - Login with test credentials (if seeded)
   - Create a checkout link
   - Test the buyer flow

3. **Set Up Custom Domain** (optional):
   - Go to Vercel Dashboard > Settings > Domains
   - Add your custom domain
   - Follow DNS configuration instructions

## Summary

The key issue was that the complex `installCommand` in `vercel.json` was:
1. Trying to run migrations before the build
2. Failing silently with `|| true`
3. Preventing the Next.js build from running
4. No `routes-manifest.json` was generated

Now the process is simplified:
- Vercel handles the install automatically
- `postinstall` generates Prisma client
- `build` script runs migrations and builds Next.js
- Everything works in the correct order ✅

Your deployment should now work! 🚀
