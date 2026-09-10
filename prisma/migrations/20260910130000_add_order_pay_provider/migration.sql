-- CreateEnum
CREATE TYPE "OrderPayProvider" AS ENUM ('xendit', 'midtrans');

-- AlterTable: add payProvider, rename xenditId → pspId
ALTER TABLE "Order" ADD COLUMN "payProvider" "OrderPayProvider";

ALTER TABLE "Order" RENAME COLUMN "xenditId" TO "pspId";

DROP INDEX IF EXISTS "Order_xenditId_idx";
CREATE INDEX "Order_pspId_idx" ON "Order"("pspId");

-- Existing QRIS rows were created via Xendit
UPDATE "Order" SET "payProvider" = 'xendit' WHERE "payMethod" = 'qris' AND "pspId" IS NOT NULL;
