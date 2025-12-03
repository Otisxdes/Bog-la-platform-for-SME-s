# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Bog'la** (meaning "connect" in Uzbek) is an MVP checkout link system for Uzbek Instagram/Telegram sellers to automate order collection. It replaces manual social media workflows with shareable checkout links.

**Tech Stack**: Next.js 14 (App Router) • TypeScript • PostgreSQL (Prisma) • Tailwind CSS • next-intl (ru/uz/en)

## Development Commands

```bash
npm run dev              # Development server (localhost:3000)
npm run build            # Production build (runs scripts/build.sh)
npm run db:migrate       # Run database migrations (development)
npm run db:studio        # Open Prisma Studio GUI
npm run db:seed          # Seed test seller: seller@example.com / password123
```

**Important**: `npm install` automatically runs `prisma generate` via postinstall hook.

## Architecture Overview

### Route Structure

```
/app/[locale]/                    # i18n wrapper (ru/uz/en)
├── (seller)/                     # Seller dashboard (auth protected)
│   ├── layout.tsx                # Auth guard via localStorage
│   ├── login/page.tsx            # Excluded from auth check
│   ├── dashboard/page.tsx
│   ├── checkout-links/
│   ├── orders/
│   └── customers/
├── (buyer)/                      # Public checkout pages
│   └── b/[sellerSlug]/[checkoutSlug]/
│       ├── page.tsx              # Checkout form
│       └── success/page.tsx      # Order confirmation
└── /app/api/                     # API routes (NOT under [locale])
    ├── auth/login/route.ts
    ├── checkout-links/
    ├── orders/
    └── customers/
```

**Key Pattern**: Route groups `(seller)` and `(buyer)` separate concerns without affecting URLs. Auth guard is layout-based, not middleware.

### Database Architecture

```
Seller (1:M)
├─→ CheckoutLink (cascade delete)
├─→ Customer (cascade delete)
└─→ Order (cascade delete)

CheckoutLink (1:M) ─→ Order (cascade delete)
Customer (0:M) ─→ Order (set null on delete)
```

**Critical Design**: `Order.contactSnapshot` (JSON) preserves buyer details even if Customer is deleted, ensuring orders are always fulfillable.

**JSON Fields**:
- `CheckoutLink.sizes`: `["S", "M", "L"]` - Flexible size options
- `CheckoutLink.deliveryOptions`: `{"courierCity": true, ...}` - Delivery methods
- `Order.contactSnapshot`: Full buyer contact at order time

**Composite Unique Constraints**:
- `CheckoutLink`: `@@unique([sellerId, slug])` - Each seller has unique slugs
- `Customer`: `@@unique([sellerId, phone])` - Phone uniqueness per seller

### Authentication (MVP Only - Not Production Ready!)

**Seller**: localStorage-based Base64 tokens (`sellerId:timestamp`)
- Token stored as `bogla_seller_token`
- Auth guard in `(seller)/layout.tsx` checks localStorage
- API protection via `getSellerIdFromRequest(request)` helper

**Buyer**: No authentication required
- Optional profile saved to localStorage per seller: `bogla_{sellerId}_buyerProfile`
- User controls data persistence via "Save my details" checkbox

**Warning**: This auth is intentionally simple for MVP. Don't upgrade without explicit request.

### Internationalization (next-intl)

- **Middleware**: `middleware.ts` handles locale routing (excludes `/api/*`)
- **Locales**: Russian (default, no prefix), Uzbek (`/uz`), English (`/en`)
- **Config**: `i18n/config.ts`, `i18n/routing.ts`, `i18n/request.ts`
- **Translations**: `messages/{locale}.json`
- **Usage**: `const t = useTranslations('namespace')` → `t('key')`

### Checkout Flow

1. Buyer accesses `/b/{sellerSlug}/{checkoutSlug}`
2. Page fetches checkout link via `/api/checkout-links/{sellerSlug}/{checkoutSlug}`
3. Check localStorage for saved profile (`bogla_{sellerId}_buyerProfile`)
4. Show "Use saved details" banner if profile exists
5. Submit order to `/api/orders` with contact details + `saveDetails` flag
6. Backend:
   - Creates Order with `contactSnapshot` (always)
   - Upserts Customer if `saveDetails === true` (keyed by sellerId + phone)
7. Save profile to localStorage if `saveDetails === true`
8. Redirect to success page with orderId

**Key Insight**: Order creation never depends on customer consent. Contact snapshot ensures fulfillment always possible.

## Important Patterns

### 1. Serverless Optimization

All API routes must include:
```typescript
export const dynamic = 'force-dynamic'
```

Prisma uses global singleton pattern (`lib/prisma.ts`) to prevent connection exhaustion.

### 2. Two-Part Slug System

Format: `/b/{sellerSlug}/{checkoutSlug}`

Database lookup:
```typescript
// 1. Find seller by slug
const seller = await prisma.seller.findUnique({ where: { slug: sellerSlug } })
// 2. Find checkout link with composite key
const link = await prisma.checkoutLink.findUnique({
  where: { sellerId_slug: { sellerId: seller.id, slug: checkoutSlug } }
})
```

Why: Prevents namespace collisions, allows multiple sellers to use same product slugs.

### 3. Customer Upsert Pattern

```typescript
await prisma.customer.upsert({
  where: { sellerId_phone: { sellerId, phone } },
  update: { fullName, city, address, lastUsedAt: new Date() },
  create: { sellerId, fullName, phone, ... }
})
```

Phone number is the unique identifier per seller. Always updates `lastUsedAt`.

### 4. JSON Field Handling

Always parse JSON fields from database:
```typescript
const sizes = JSON.parse(checkoutLink.sizes)  // string[]
const options = JSON.parse(checkoutLink.deliveryOptions)  // DeliveryOptions
const contact = JSON.parse(order.contactSnapshot)  // ContactSnapshot
```

Validate with Zod before storage:
```typescript
z.array(z.string()).min(1)  // sizes
z.object({ courierCity: z.boolean(), ... }).refine(...)  // deliveryOptions
```

### 5. LocalStorage Keys

- `bogla_seller_token`: Seller auth token
- `bogla_seller`: Seller profile JSON
- `bogla_{sellerId}_buyerProfile`: Buyer profile per seller

Use custom hook: `useLocalStorage(key, initialValue)` from `lib/hooks/useLocalStorage.ts`

### 6. API Error Handling

Consistent pattern across all routes:
```typescript
try {
  const validated = schema.parse(body)  // Zod validation
  // ... business logic
} catch (error: any) {
  if (error.name === 'ZodError') {
    return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
  }
  console.error('Error:', error)
  return NextResponse.json({ error: 'Failed to ...' }, { status: 500 })
}
```

### 7. Next.js 14 Async Params

Route params are now Promises:
```typescript
export async function GET(request, { params }) {
  const { slug } = await params  // ✅ Must await
}
```

## Common Development Tasks

### Adding New Translation Keys
1. Add to `messages/en.json`
2. Copy to `messages/ru.json` and `messages/uz.json`
3. Use: `const t = useTranslations('namespace')` → `t('key')`

### Creating New Seller Page
1. Create `app/[locale]/(seller)/your-page/page.tsx`
2. Add nav link in `app/[locale]/(seller)/layout.tsx`
3. Page automatically gets auth guard from layout

### Adding New API Endpoint
1. Create `app/api/your-endpoint/route.ts`
2. Add `export const dynamic = 'force-dynamic'`
3. Use `getSellerIdFromRequest(request)` for protected routes
4. Return `NextResponse.json(data, { status })`

### Modifying Database Schema
1. Edit `prisma/schema.prisma`
2. Run `npm run db:generate` (updates Prisma client)
3. Run `npm run db:migrate` (creates migration)
4. Commit both schema and migration files

### Testing Locally
1. Run `npm run db:migrate` to ensure database is up-to-date
2. Run `npm run db:seed` for test data (seller@example.com / password123)
3. Use `npm run db:studio` to inspect database
4. Test checkout at `http://localhost:3000/b/test-seller/white-hoodie`

## Deployment Configuration

**Vercel Setup**: Minimal `vercel.json` with `{"framework": "nextjs"}`

**Build Process** (`scripts/build.sh`):
1. Always: `prisma generate`
2. If `DATABASE_URL` exists: `prisma migrate deploy` (production)
3. Always: `next build`
4. Gracefully handles migration failures

**Required Environment Variable**:
```bash
DATABASE_URL="postgresql://user:password@host:5432/database"
```

## Known Limitations (Intentional MVP Decisions)

### Authentication
- ❌ Not production-ready (localStorage + Base64 tokens)
- ❌ No CSRF protection or rate limiting
- ✅ Acceptable for MVP testing

### Payment
- ❌ No online payment integration (manual via Payme/Click/Uzcard)
- ❌ Seller manually updates payment status

### Scalability
- ⚠️ JSON fields hard to query (e.g., "find all links with size L")
- ⚠️ No caching layer
- ⚠️ Pagination hardcoded to 20 items

### Missing Features (By Design)
- No inventory management
- No email notifications
- No buyer order tracking
- No analytics/reporting
- No discount codes

## Critical Rules for AI Assistants

1. **Never modify auth without explicit request** - It's intentionally simple
2. **Always validate with Zod** - Use schemas in `lib/validations.ts`
3. **Preserve contact snapshots** - Order fulfillment depends on them
4. **Test on mobile** - Primary use case is mobile buyers
5. **Keep translations synchronized** - All three language files must match
6. **Force dynamic for API routes** - Required for serverless
7. **Verify localStorage** - Many auth issues are localStorage-related
8. **Check Prisma Studio first** - Visual debugging is faster than logs

## Key File References

- **Database Schema**: `prisma/schema.prisma`
- **Auth Helpers**: `lib/auth.ts` (getSellerIdFromRequest, hashPassword)
- **Validations**: `lib/validations.ts` (Zod schemas)
- **Prisma Client**: `lib/prisma.ts` (singleton pattern)
- **i18n Config**: `i18n/config.ts`, `i18n/routing.ts`
- **Build Script**: `scripts/build.sh` (Vercel deployment)
- **Seed Data**: `scripts/seed.ts` (test seller creation)

## Additional Documentation

- Product spec: `docs/bogla-mvp-spec.md` (detailed requirements)
- Deployment guide: `VERCEL_DEPLOYMENT_GUIDE.md` (step-by-step instructions)
