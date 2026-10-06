-- AlterEnum
ALTER TYPE "ApplicationSource" ADD VALUE 'amendment';

-- AlterTable
ALTER TABLE "Agreement" ADD COLUMN     "amendmentNote" TEXT,
ADD COLUMN     "amendsId" TEXT;

-- CreateTable
CREATE TABLE "PortfolioMember" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'manager',
    "status" TEXT NOT NULL DEFAULT 'invited',
    "inviteEmail" TEXT NOT NULL,
    "inviteToken" TEXT NOT NULL,
    "tokenExpires" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "PortfolioMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PortfolioMember_inviteToken_key" ON "PortfolioMember"("inviteToken");

-- CreateIndex
CREATE INDEX "PortfolioMember_ownerId_idx" ON "PortfolioMember"("ownerId");

-- CreateIndex
CREATE INDEX "PortfolioMember_userId_idx" ON "PortfolioMember"("userId");

-- CreateIndex
CREATE INDEX "PortfolioMember_inviteEmail_idx" ON "PortfolioMember"("inviteEmail");

-- CreateIndex
CREATE UNIQUE INDEX "Agreement_amendsId_key" ON "Agreement"("amendsId");

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_amendsId_fkey" FOREIGN KEY ("amendsId") REFERENCES "Agreement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioMember" ADD CONSTRAINT "PortfolioMember_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PortfolioMember" ADD CONSTRAINT "PortfolioMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

