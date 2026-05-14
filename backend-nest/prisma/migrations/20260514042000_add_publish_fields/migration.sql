-- Add publish fields to properties table
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "isPublished" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "properties" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;

-- Add publish fields to units table
ALTER TABLE "units" ADD COLUMN IF NOT EXISTS "isPublished" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "units" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
