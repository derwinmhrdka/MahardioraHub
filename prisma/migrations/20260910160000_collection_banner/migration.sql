-- AlterTable
ALTER TABLE "Setting" ADD COLUMN "collectionBannerActive" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Setting" ADD COLUMN "collectionBannerImages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
