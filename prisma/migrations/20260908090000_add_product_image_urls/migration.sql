-- AlterTable
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "imageUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Backfill cover image into gallery array
UPDATE "Product"
SET "imageUrls" = ARRAY["imageUrl"]
WHERE "imageUrl" IS NOT NULL
  AND "imageUrl" <> ''
  AND (cardinality("imageUrls") = 0 OR "imageUrls" IS NULL);
