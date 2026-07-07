-- CreateTable: reusable/portable screening report (CRA-of-record income + credit),
-- reused across every Rentra application until it expires (CA AB 2559 freshness).
CREATE TABLE "ScreeningReport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "externalReportId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "verifiedMonthlyIncome" INTEGER,
    "incomeSource" JSONB,
    "creditScore" INTEGER,
    "creditTier" TEXT,
    "backgroundResult" JSONB,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consentAt" TIMESTAMP(3) NOT NULL,
    "disclosureVersion" TEXT NOT NULL,
    "reportUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScreeningReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScreeningReport_userId_idx" ON "ScreeningReport"("userId");
CREATE INDEX "ScreeningReport_expiresAt_idx" ON "ScreeningReport"("expiresAt");
CREATE INDEX "ScreeningReport_status_idx" ON "ScreeningReport"("status");

-- AlterTable: link applications to a reusable report + carry any housing voucher
ALTER TABLE "Application" ADD COLUMN     "screeningReportId" TEXT,
ADD COLUMN     "voucherAmount" INTEGER;

-- AlterTable: screening criteria stated up front (CA AB 2493)
ALTER TABLE "Listing" ADD COLUMN     "screeningCriteria" JSONB;

-- AlterTable: link the guarantor's reusable report
ALTER TABLE "Cosigner" ADD COLUMN     "screeningReportId" TEXT;

-- AlterTable: tie a charge to the report it purchased
ALTER TABLE "Transaction" ADD COLUMN     "screeningReportId" TEXT;

-- CreateIndex
CREATE INDEX "Application_screeningReportId_idx" ON "Application"("screeningReportId");
CREATE INDEX "Cosigner_screeningReportId_idx" ON "Cosigner"("screeningReportId");
CREATE INDEX "Transaction_screeningReportId_idx" ON "Transaction"("screeningReportId");

-- AddForeignKey
ALTER TABLE "ScreeningReport" ADD CONSTRAINT "ScreeningReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Application" ADD CONSTRAINT "Application_screeningReportId_fkey" FOREIGN KEY ("screeningReportId") REFERENCES "ScreeningReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Cosigner" ADD CONSTRAINT "Cosigner_screeningReportId_fkey" FOREIGN KEY ("screeningReportId") REFERENCES "ScreeningReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_screeningReportId_fkey" FOREIGN KEY ("screeningReportId") REFERENCES "ScreeningReport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
