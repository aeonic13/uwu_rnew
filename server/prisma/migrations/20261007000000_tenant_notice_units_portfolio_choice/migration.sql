-- AlterTable
ALTER TABLE "User" ADD COLUMN     "activePortfolioOwnerId" TEXT;

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "unitLabel" TEXT;

-- AlterTable
ALTER TABLE "Agreement" ADD COLUMN     "tenantNoticeAt" TIMESTAMP(3),
ADD COLUMN     "tenantNoticeMoveOut" TIMESTAMP(3),
ADD COLUMN     "tenantNoticeById" TEXT,
ADD COLUMN     "tenantNoticeReason" TEXT,
ADD COLUMN     "removedTenantIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "rentIncreaseNoticeDays" INTEGER;

-- AlterTable
ALTER TABLE "TenantInvite" ADD COLUMN     "declineReason" TEXT;
