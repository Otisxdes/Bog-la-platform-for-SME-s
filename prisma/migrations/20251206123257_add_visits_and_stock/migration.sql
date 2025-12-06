-- AlterTable
ALTER TABLE "CheckoutLink" ADD COLUMN     "visits" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stock" INTEGER;
