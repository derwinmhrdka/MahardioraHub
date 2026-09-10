-- AlterTable
ALTER TABLE "Setting" ADD COLUMN "collectionBannerHidden" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
