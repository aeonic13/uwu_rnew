-- AlterTable: universal rental application answers, filled once at
-- pre-qualification and reused to prefill every property application
ALTER TABLE "User" ADD COLUMN     "rentalProfile" JSONB;
