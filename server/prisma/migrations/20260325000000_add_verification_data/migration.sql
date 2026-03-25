-- AlterTable: add verificationData JSON column to Application
ALTER TABLE "Application" ADD COLUMN "verificationData" JSONB;
