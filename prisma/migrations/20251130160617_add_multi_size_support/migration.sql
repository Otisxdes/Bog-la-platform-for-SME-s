-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- Step 1: Add new columns with default values
ALTER TABLE "CheckoutLink" ADD COLUMN "sizes" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "Order" ADD COLUMN "selectedSize" TEXT NOT NULL DEFAULT '';

-- Step 2: Migrate existing size data to sizes (as JSON array with single element)
UPDATE "CheckoutLink" SET sizes = json_array(size) WHERE size IS NOT NULL AND size != '';

-- Step 3: Migrate existing size data to selectedSize in orders
UPDATE "Order" SET selectedSize = (
  SELECT CheckoutLink.size 
  FROM CheckoutLink 
  WHERE CheckoutLink.id = "Order".checkoutLinkId
) WHERE EXISTS (
  SELECT 1 
  FROM CheckoutLink 
  WHERE CheckoutLink.id = "Order".checkoutLinkId AND CheckoutLink.size IS NOT NULL
);

-- Step 4: Drop old size column from CheckoutLink
CREATE TABLE "new_CheckoutLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sellerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'UZS',
    "defaultQty" INTEGER NOT NULL DEFAULT 1,
    "maxQty" INTEGER,
    "imageUrl" TEXT,
    "sizes" TEXT NOT NULL DEFAULT '[]',
    "deliveryOptions" TEXT NOT NULL,
    "paymentNote" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CheckoutLink_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

INSERT INTO "new_CheckoutLink" ("id", "sellerId", "name", "slug", "price", "currency", "defaultQty", "maxQty", "imageUrl", "sizes", "deliveryOptions", "paymentNote", "createdAt", "updatedAt")
SELECT "id", "sellerId", "name", "slug", "price", "currency", "defaultQty", "maxQty", "imageUrl", "sizes", "deliveryOptions", "paymentNote", "createdAt", "updatedAt" FROM "CheckoutLink";

DROP TABLE "CheckoutLink";
ALTER TABLE "new_CheckoutLink" RENAME TO "CheckoutLink";

CREATE UNIQUE INDEX "CheckoutLink_sellerId_slug_key" ON "CheckoutLink"("sellerId", "slug");
CREATE INDEX "CheckoutLink_slug_idx" ON "CheckoutLink"("slug");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

