1. Product: Bog‘la – MVP Slice

Problem to solve (this iteration)
Automate the “Manual DM → card number → screenshot → address → delivery” flow for Uzbek Instagram/Telegram sellers and start building a simple customer database without heavy friction for buyers.

We focus only on:

Seller checkout link → sharable link in bio/DM.

Buyer checkout page:

Can order as “guest”

Can choose whether to save details for faster re-order

Returning buyer:

Can reuse last address with 1 tap (no login/Auth)

Seller dashboard:

Basic customer list (CRM-lite)

Basic order list

No advanced analytics, no online payment integration yet. Payments still happen via Payme/Click/Uzcard outside Bog‘la (seller manually verifies).

2. Roles

Seller

Creates checkout links for products.

Receives orders.

Sees customers and past orders.

Buyer

Comes from Instagram/Telegram link.

Can order with minimal friction.

Can decide if they want their data saved for future.

3. Core User Flows
3.1 Seller: Create Checkout Link

Seller logs into Bog‘la.

Goes to “Checkout Links”.

Clicks “New Checkout Link”.

Fills:

Product name (e.g. “White Oversized Hoodie”)

Price (UZS)

Currency (default UZS)

Default quantity (1)

Max quantity (optional)

Delivery options (checkboxes):

Courier within city

Pickup

Region delivery

Payment instruction (free text, e.g. “Pay via Payme or Uzcard to this card: 8600 xxxx xxxx xxxx”).

Clicks Create.

App generates a short link like:

https://bogla.uz/b/{sellerSlug}/{checkoutSlug}

3.2 Buyer: New Order (first time / “guest”)

Buyer taps on seller’s link in Instagram/Telegram.

Lands on Checkout Page:

Top: seller name/logo

Product card: name, price, photo (optional), quantity selector

Delivery section:

Delivery method (dropdown/radio)

Buyer details form:

Full name (required)

Phone (required, Uzbek format)

City (dropdown: e.g. Tashkent, Samarkand, etc.)

Address (textarea)

Optional field: Instagram/Telegram username

Privacy + options:

Radio:

Use my details only for this order (default)

Save my details for faster next orders with this seller

Small line of text: “Your details are stored securely. You can ask the seller to delete them anytime.”

Buyer submits the form.

System does:

Create Order record with a full snapshot of contact+address.

If buyer chose “Save my details”, also:

Create or update Customer record linked to this seller using phone as identifier.

Regardless of marketing choice, seller must see order with all necessary details.
(So fulfillment never depends on consent.)

After order created → redirect to Order Confirmation page.

3.3 Buyer: Order Confirmation Page

Content:

✅ “Order sent to {SellerName}”

Order summary:

Product + quantity + total price

Delivery method

Contact + address

Payment instructions:

Show card number/Payme link from seller’s checkout config.

Button: Copy card number

Button: Open Instagram DM with seller (link back to IG profile).

Short note: “Seller will confirm your payment and contact you by phone or DM.”

3.4 Returning Buyer: Reuse Address (no login)

Goal: 1-tap re-use of last address while still letting the seller build a customer database.

Mechanism:

LocalStorage on buyer’s device + backend Customer model.

Flow:

When a buyer completes an order successfully, app:

Saves a lightweight profile in localStorage under a key like:

bogla_{sellerId}_buyerProfile

Example value:

{
  "fullName": "Aliyev Ali",
  "phone": "+99890xxxxxxx",
  "city": "Tashkent",
  "address": "Yunusabad 9, dom 45, kv 10",
  "username": "@aliyev"
}


On future visits to the same seller checkout link:

App checks localStorage for bogla_{sellerId}_buyerProfile.

If found, show a non-blocking banner/card above the form:

“Use your saved details from last time?”
[Use saved details] [Edit manually]

If user taps “Use saved details”:

Autofill the form fields with stored values.

User can still edit them before submitting.

On submit:

Same logic: create Order.

Backend also updates Customer record’s lastUsedAt.

Important privacy note in UI:

Small link under the banner: “Remove saved details from this device”.

On click → clear that localStorage key + hide banner.

Result:

Buyer doesn’t need OTP/login yet.

Seller still gets proper customer DB on backend.

Buyer has transparent control.

4. UI Map (Screens & Hierarchy)
4.1 Buyer-Facing

/b/[sellerSlug]/[checkoutSlug] – Checkout Page

Header:

Seller name + small logo.

Body:

Saved details banner (if localStorage exists).

Product block (name, price, quantity).

Delivery options.

Buyer details form.

Privacy options (use only / save for next time).

Primary CTA: “Place Order”.

Error states:

Form validation errors inline.

Global error banner if submission fails.

/b/[sellerSlug]/[checkoutSlug]/success?orderId=... – Order Confirmation

Success icon and message.

Order summary (no editing here).

Payment instructions block:

Card number with copy button.

Optional Payme/Click URL as button.

Button: “Back to Instagram profile” (seller’s IG link from config).

Button: “Create another order” (link back to checkout page).

4.2 Seller App

/login

Simple login (email + password, or magic link – up to implementation).

/dashboard

Top: “Today’s orders”, “Total orders”, “Total customers”.

List of latest orders (table):

Time

Buyer name

Product

Status (New, Paid, Shipped)

/checkout-links

List of seller’s links:

Name

URL

Created date

Orders count

Button: “New Checkout Link”

/checkout-links/new

Form as defined in 3.1.

/customers

Table:

Buyer name

Phone

City

Total orders

Last order date

“Saved details?” or “Marketing opt-in?” flag

Clicking a row opens /customers/[id].

/customers/[id]

Customer profile:

Name, phone, city, address

Marketing opt-in flag

List of orders from this customer (with link to each order detail).

/orders/[id]

Full order view:

Product and quantity

Contact + address snapshot

Delivery method

Payment status (dropdown: New, Paid, Cancelled)

Delivery status (Pending, Sent, Delivered)

Seller can update statuses by hand.

5. Data Model (Backend)

Use relational models (Postgres/MySQL/SQLite). Example in pseudo-Prisma style.

5.1 Seller
model Seller {
  id           String   @id @default(cuid())
  name         String
  slug         String   @unique
  email        String   @unique
  instagramUrl String?  // for "Back to Instagram" CTA
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  checkoutLinks CheckoutLink[]
  customers     Customer[]
  orders        Order[]
}

5.2 CheckoutLink
model CheckoutLink {
  id            String   @id @default(cuid())
  sellerId      String
  seller        Seller   @relation(fields: [sellerId], references: [id])
  name          String   // "White Oversized Hoodie"
  slug          String   // per seller, unique
  price         Int      // in UZS
  currency      String   // "UZS"
  defaultQty    Int      @default(1)
  maxQty        Int?     // optional

  deliveryOptions Json   // e.g. { "courierCity": true, "pickup": true, "region": false }
  paymentNote    String  // text seller enters for payment instructions

  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  orders         Order[]
}

5.3 Customer
model Customer {
  id             String    @id @default(cuid())
  sellerId       String
  seller         Seller    @relation(fields: [sellerId], references: [id])

  fullName       String
  phone          String    // consider index + uniqueness per seller
  city           String?
  address        String?
  username       String?   // IG/TG

  marketingOptIn Boolean   @default(false)
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  lastUsedAt     DateTime?

  orders         Order[]
}

5.4 Order
model Order {
  id              String        @id @default(cuid())
  sellerId        String
  seller          Seller        @relation(fields: [sellerId], references: [id])

  checkoutLinkId  String
  checkoutLink    CheckoutLink  @relation(fields: [checkoutLinkId], references: [id])

  customerId      String?       // null if not saved / “guest only”
  customer        Customer?     @relation(fields: [customerId], references: [id])

  quantity        Int           @default(1)
  totalPrice      Int           // derived: quantity * price

  contactSnapshot Json          // full form content at time of order 
                                // { fullName, phone, city, address, username }

  deliveryMethod  String        // e.g. "courier_city", "pickup"
  paymentStatus   String        @default("new")        // "new" | "paid" | "cancelled"
  deliveryStatus  String        @default("pending")    // "pending" | "sent" | "delivered"

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}

6. API Endpoints (Example Shape)

Assume REST-ish API. Adjust to framework (Next.js route handlers, etc.).

POST /api/checkout-links

Body: { name, price, currency, defaultQty, maxQty, deliveryOptions, paymentNote }

Auth: seller only.

GET /api/checkout-links

Returns seller’s links.

GET /api/checkout-links/[slug]

Used for buyer checkout page preload (product + seller info).

POST /api/orders

Body:

{
  "checkoutLinkId": "string",
  "quantity": 1,
  "deliveryMethod": "courier_city",
  "buyer": {
    "fullName": "string",
    "phone": "string",
    "city": "string",
    "address": "string",
    "username": "@username"
  },
  "saveDetails": true
}


Logic:

Create Order.

If saveDetails === true, upsert Customer by (sellerId + phone).

GET /api/orders

Returns paginated list of seller orders.

GET /api/orders/[id]

Returns single order.

PATCH /api/orders/[id]

Update paymentStatus / deliveryStatus.

GET /api/customers

Returns seller’s customers with aggregated stats.

GET /api/customers/[id]

Returns customer detail + orders.

7. Frontend Implementation Notes (for Cursor)

Stack suggestion (you can let Cursor choose but this is a sane default):

Framework: Next.js (App Router) + TypeScript

UI: Tailwind CSS

Forms: React Hook Form + Zod

DB: Prisma + SQLite/Postgres (depending on environment)

Auth: Simple email/password or magic link (Clerk/Auth.js/etc. – up to implementation).

Validation:

Required fields on buyer form: fullName, phone, city, address, deliveryMethod.

Price & quantity must be positive.

Phone simple regex for Uzbek format (+998 etc.) but keep light.

State management:

Use localStorage hook on buyer side to:

Read/write bogla_{sellerId}_buyerProfile.

Provide “Use saved details” banner.

Provide “Remove saved details from this device”.

UX priorities:

Buyer checkout page must be super minimal and mobile-first.

Avoid clutter, no complex registration.

Show clear hierarchy: product → order form → payment instructions.