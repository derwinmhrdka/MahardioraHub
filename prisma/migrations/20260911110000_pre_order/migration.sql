-- CreateTable
CREATE TABLE "PreOrder" (
    "id" SERIAL NOT NULL,
    "lastOrderDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreOrderItem" (
    "id" SERIAL NOT NULL,
    "preOrderId" INTEGER NOT NULL,
    "productId" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PreOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PreOrder_lastOrderDate_idx" ON "PreOrder"("lastOrderDate");

-- CreateIndex
CREATE UNIQUE INDEX "PreOrderItem_productId_key" ON "PreOrderItem"("productId");

-- CreateIndex
CREATE INDEX "PreOrderItem_preOrderId_sortOrder_idx" ON "PreOrderItem"("preOrderId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "PreOrderItem_preOrderId_productId_key" ON "PreOrderItem"("preOrderId", "productId");

-- AddForeignKey
ALTER TABLE "PreOrderItem" ADD CONSTRAINT "PreOrderItem_preOrderId_fkey" FOREIGN KEY ("preOrderId") REFERENCES "PreOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreOrderItem" ADD CONSTRAINT "PreOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
