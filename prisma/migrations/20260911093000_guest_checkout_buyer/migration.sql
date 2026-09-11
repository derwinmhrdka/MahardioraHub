-- AlterTable User
ALTER TABLE "User" ADD COLUMN "phone" TEXT,
ADD COLUMN "address" TEXT;

-- CreateTable GuestBuyer
CREATE TABLE "GuestBuyer" (
    "whatsapp" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestBuyer_pkey" PRIMARY KEY ("whatsapp")
);

-- AlterTable CartItem: ownerKey replaces userId
ALTER TABLE "CartItem" ADD COLUMN "ownerKey" TEXT;

UPDATE "CartItem" SET "ownerKey" = 'u_' || "userId";

ALTER TABLE "CartItem" ALTER COLUMN "ownerKey" SET NOT NULL;

DROP INDEX IF EXISTS "CartItem_userId_productId_key";
DROP INDEX IF EXISTS "CartItem_userId_idx";

ALTER TABLE "CartItem" DROP CONSTRAINT "CartItem_userId_fkey";

ALTER TABLE "CartItem" DROP COLUMN "userId";

CREATE UNIQUE INDEX "CartItem_ownerKey_productId_key" ON "CartItem"("ownerKey", "productId");
CREATE INDEX "CartItem_ownerKey_idx" ON "CartItem"("ownerKey");

-- AlterTable Order: guest checkout + buyer snapshot
ALTER TABLE "Order" ADD COLUMN "guestId" TEXT,
ADD COLUMN "buyerName" TEXT,
ADD COLUMN "buyerWhatsapp" TEXT,
ADD COLUMN "buyerAddress" TEXT;

UPDATE "Order" AS o
SET
  "buyerName" = COALESCE(
    (SELECT u."name" FROM "User" u WHERE u."id" = o."userId"),
    'Pembeli'
  ),
  "buyerWhatsapp" = '',
  "buyerAddress" = '';

ALTER TABLE "Order" ALTER COLUMN "buyerName" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "buyerWhatsapp" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "buyerAddress" SET NOT NULL;

ALTER TABLE "Order" DROP CONSTRAINT "Order_userId_fkey";
ALTER TABLE "Order" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Order_guestId_status_idx" ON "Order"("guestId", "status");
CREATE INDEX "Order_buyerWhatsapp_idx" ON "Order"("buyerWhatsapp");
