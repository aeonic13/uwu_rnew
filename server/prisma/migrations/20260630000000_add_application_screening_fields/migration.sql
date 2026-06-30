-- AlterTable: applicant screening fields
ALTER TABLE "User" ADD COLUMN     "year" TEXT,
ADD COLUMN     "creditScore" INTEGER,
ADD COLUMN     "creditTier" TEXT,
ADD COLUMN     "backgroundCheck" TEXT;

-- AlterTable: application detail + tour fields
ALTER TABLE "Application" ADD COLUMN     "employmentStatus" TEXT,
ADD COLUMN     "references" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "documents" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "tourStatus" TEXT NOT NULL DEFAULT 'not-requested',
ADD COLUMN     "tourDate" TIMESTAMP(3);
