-- Tenant money tools ahead of Moov: stored utility bills with files and a
-- monthly period, a household rent split per lease, and autopay schedules
-- that remind today and will move money once ACH is live.

-- AlterTable
ALTER TABLE "UtilityBill" ADD COLUMN     "period" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "fileUrl" TEXT,
ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "mimeType" TEXT;

-- AlterTable
ALTER TABLE "UtilityBillShare" ADD COLUMN     "paidAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "RentSplit" (
    "id" TEXT NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "splitMode" TEXT NOT NULL DEFAULT 'equal',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "agreementId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "RentSplit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentSplitShare" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "splitId" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "RentSplitShare_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AutopaySchedule" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "dayOfMonth" INTEGER NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'ach',
    "status" TEXT NOT NULL DEFAULT 'active',
    "nextRunAt" TIMESTAMP(3) NOT NULL,
    "lastRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,

    CONSTRAINT "AutopaySchedule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UtilityBill_period_idx" ON "UtilityBill"("period");

-- CreateIndex
CREATE UNIQUE INDEX "RentSplit_agreementId_key" ON "RentSplit"("agreementId");

-- CreateIndex
CREATE INDEX "RentSplit_createdById_idx" ON "RentSplit"("createdById");

-- CreateIndex
CREATE INDEX "RentSplitShare_splitId_idx" ON "RentSplitShare"("splitId");

-- CreateIndex
CREATE INDEX "RentSplitShare_userId_idx" ON "RentSplitShare"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AutopaySchedule_userId_agreementId_key" ON "AutopaySchedule"("userId", "agreementId");

-- CreateIndex
CREATE INDEX "AutopaySchedule_status_nextRunAt_idx" ON "AutopaySchedule"("status", "nextRunAt");

-- AddForeignKey
ALTER TABLE "RentSplit" ADD CONSTRAINT "RentSplit_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentSplit" ADD CONSTRAINT "RentSplit_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentSplitShare" ADD CONSTRAINT "RentSplitShare_splitId_fkey" FOREIGN KEY ("splitId") REFERENCES "RentSplit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentSplitShare" ADD CONSTRAINT "RentSplitShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutopaySchedule" ADD CONSTRAINT "AutopaySchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AutopaySchedule" ADD CONSTRAINT "AutopaySchedule_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
