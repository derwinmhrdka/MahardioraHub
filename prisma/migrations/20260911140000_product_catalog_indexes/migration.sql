-- Product catalog query indexes
CREATE INDEX IF NOT EXISTS "Product_kind_isActive_createdAt_idx" ON "Product"("kind", "isActive", "createdAt");
CREATE INDEX IF NOT EXISTS "Product_categoryId_isActive_idx" ON "Product"("categoryId", "isActive");
CREATE INDEX IF NOT EXISTS "Product_isActive_kind_idx" ON "Product"("isActive", "kind");
