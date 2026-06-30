-- CreateTable
CREATE TABLE "UtilityBill" (
    "id" TEXT NOT NULL,
    "utilityType" TEXT NOT NULL,
    "provider" TEXT,
    "dueDate" TIMESTAMP(3),
    "total" DOUBLE PRECISION NOT NULL,
    "splitMode" TEXT NOT NULL DEFAULT 'equal',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "UtilityBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UtilityBillShare" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "billId" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "UtilityBillShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UtilityBill_createdById_idx" ON "UtilityBill"("createdById");

-- CreateIndex
CREATE INDEX "UtilityBillShare_billId_idx" ON "UtilityBillShare"("billId");

-- CreateIndex
CREATE INDEX "UtilityBillShare_userId_idx" ON "UtilityBillShare"("userId");

-- AddForeignKey
ALTER TABLE "UtilityBill" ADD CONSTRAINT "UtilityBill_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UtilityBillShare" ADD CONSTRAINT "UtilityBillShare_billId_fkey" FOREIGN KEY ("billId") REFERENCES "UtilityBill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UtilityBillShare" ADD CONSTRAINT "UtilityBillShare_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
