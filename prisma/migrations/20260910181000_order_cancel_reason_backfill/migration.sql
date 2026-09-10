-- AlterTable
ALTER TABLE "Order" ADD COLUMN "cancelReason" TEXT;

-- Existing paid orders were already treated as done for buyers.
UPDATE "Order" SET status = 'completed' WHERE status = 'paid';
