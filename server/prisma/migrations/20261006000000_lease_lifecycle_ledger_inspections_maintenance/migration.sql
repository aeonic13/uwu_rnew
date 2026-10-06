-- AlterEnum
ALTER TYPE "ApplicationSource" ADD VALUE 'renewal';

-- AlterTable
ALTER TABLE "Agreement" ADD COLUMN     "endReason" TEXT,
ADD COLUMN     "endedAt" TIMESTAMP(3),
ADD COLUMN     "lateFeeAmount" INTEGER,
ADD COLUMN     "lateFeeGraceDays" INTEGER,
ADD COLUMN     "renewsId" TEXT;

-- AlterTable
ALTER TABLE "MaintenanceTicket" ADD COLUMN     "cost" INTEGER,
ADD COLUMN     "expenseId" TEXT,
ADD COLUMN     "vendorPhone" TEXT;

-- CreateTable
CREATE TABLE "RentCharge" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "agreementId" TEXT NOT NULL,
    "userId" TEXT,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "RentCharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inspection" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "conductedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "items" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "listingId" TEXT NOT NULL,
    "agreementId" TEXT,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "Inspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceComment" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "photos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "MaintenanceComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RentCharge_agreementId_idx" ON "RentCharge"("agreementId");

-- CreateIndex
CREATE INDEX "RentCharge_userId_idx" ON "RentCharge"("userId");

-- CreateIndex
CREATE INDEX "RentCharge_dueDate_idx" ON "RentCharge"("dueDate");

-- CreateIndex
CREATE INDEX "Inspection_listingId_idx" ON "Inspection"("listingId");

-- CreateIndex
CREATE INDEX "Inspection_agreementId_idx" ON "Inspection"("agreementId");

-- CreateIndex
CREATE INDEX "Inspection_ownerId_idx" ON "Inspection"("ownerId");

-- CreateIndex
CREATE INDEX "MaintenanceComment_ticketId_idx" ON "MaintenanceComment"("ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "Agreement_renewsId_key" ON "Agreement"("renewsId");

-- CreateIndex
CREATE UNIQUE INDEX "MaintenanceTicket_expenseId_key" ON "MaintenanceTicket"("expenseId");

-- AddForeignKey
ALTER TABLE "MaintenanceTicket" ADD CONSTRAINT "MaintenanceTicket_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_renewsId_fkey" FOREIGN KEY ("renewsId") REFERENCES "Agreement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentCharge" ADD CONSTRAINT "RentCharge_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentCharge" ADD CONSTRAINT "RentCharge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentCharge" ADD CONSTRAINT "RentCharge_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceComment" ADD CONSTRAINT "MaintenanceComment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "MaintenanceTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceComment" ADD CONSTRAINT "MaintenanceComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

