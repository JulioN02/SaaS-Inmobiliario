-- Add documents JSONB field to occupancies table
ALTER TABLE "occupancies" ADD COLUMN IF NOT EXISTS "documents" JSONB;
