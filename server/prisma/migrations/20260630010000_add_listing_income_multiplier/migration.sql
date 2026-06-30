-- AlterTable: per-listing income requirement multiple (default 3x rent)
ALTER TABLE "Listing" ADD COLUMN     "incomeMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 3;
