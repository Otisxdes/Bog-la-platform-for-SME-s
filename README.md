# Bog'la MVP

A checkout link system for Uzbek Instagram/Telegram sellers to automate order collection.

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite (via Prisma ORM)
- **Forms**: React Hook Form + Zod validation

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Git

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up the database:
```bash
# Generate Prisma client
npm run db:generate

# Run migrations (creates database file)
npm run db:migrate
```

3. Seed the database with a test seller:
```bash
npm run db:seed
```

This creates a test seller:
- Email: seller@example.com
- Password: password123
- Slug: test-seller

Or create a seller manually using Prisma Studio:
```bash
npm run db:studio
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
/app
  /api              # API route handlers
  /(buyer)          # Buyer-facing pages
    /b/[sellerSlug]/[checkoutSlug]
  /(seller)         # Seller dashboard pages
    /login
    /dashboard
    /checkout-links
    /orders
    /customers
/components         # Reusable React components
/lib                # Utilities, Prisma client, validation schemas
/prisma             # Prisma schema and migrations
/docs               # PRD documentation
```

## API Routes

### Public Routes
- `GET /api/checkout-links/[slug]` - Get checkout link by slug
- `POST /api/orders` - Create order

### Protected Routes (require seller auth)
- `POST /api/checkout-links` - Create checkout link
- `GET /api/checkout-links` - List seller's checkout links
- `GET /api/orders` - List seller's orders
- `GET /api/orders/[id]` - Get order details
- `PATCH /api/orders/[id]` - Update order status
- `GET /api/customers` - List seller's customers
- `GET /api/customers/[id]` - Get customer details
- `POST /api/auth/login` - Seller login

## Buyer Flow

1. Buyer visits `/b/[sellerSlug]/[checkoutSlug]`
2. Fills out order form
3. Optionally saves details for future orders (localStorage)
4. Submits order
5. Redirected to success page with payment instructions

## Seller Flow

1. Login at `/login`
2. Dashboard shows stats and latest orders
3. Create checkout links at `/checkout-links/new`
4. View and manage orders at `/orders`
5. View customer database at `/customers`

## Database Schema

- **Seller**: Seller accounts
- **CheckoutLink**: Product checkout links
- **Customer**: Buyer information (optional opt-in)
- **Order**: Order records with contact snapshots

## Environment Variables

Create a `.env` file:
```
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

## Development

- Run migrations: `npm run db:migrate`
- Open Prisma Studio: `npm run db:studio`
- Generate Prisma client: `npm run db:generate`

## Notes

- Authentication is basic (localStorage tokens) - upgrade for production
- Payment integration is manual (seller verifies outside system)
- No advanced analytics or inventory management (MVP only)

