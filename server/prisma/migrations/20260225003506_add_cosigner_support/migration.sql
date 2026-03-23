-- CreateEnum
CREATE TYPE "CosignerStatus" AS ENUM ('pending', 'accepted', 'declined');

-- AlterEnum
ALTER TYPE "UserType" ADD VALUE 'cosigner';

-- CreateTable
CREATE TABLE "Cosigner" (
    "id" TEXT NOT NULL,
    "status" "CosignerStatus" NOT NULL DEFAULT 'pending',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "relationshipType" TEXT,
    "inviteEmail" TEXT NOT NULL,
    "inviteToken" TEXT NOT NULL,
    "tokenExpires" TIMESTAMP(3) NOT NULL,
    "applicationId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "cosignerId" TEXT,

    CONSTRAINT "Cosigner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cosigner_inviteToken_key" ON "Cosigner"("inviteToken");

-- CreateIndex
CREATE INDEX "Cosigner_applicationId_idx" ON "Cosigner"("applicationId");

-- CreateIndex
CREATE INDEX "Cosigner_tenantId_idx" ON "Cosigner"("tenantId");

-- CreateIndex
CREATE INDEX "Cosigner_cosignerId_idx" ON "Cosigner"("cosignerId");

-- CreateIndex
CREATE INDEX "Cosigner_inviteToken_idx" ON "Cosigner"("inviteToken");

-- CreateIndex
CREATE INDEX "Cosigner_status_idx" ON "Cosigner"("status");

-- AddForeignKey
ALTER TABLE "Cosigner" ADD CONSTRAINT "Cosigner_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cosigner" ADD CONSTRAINT "Cosigner_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cosigner" ADD CONSTRAINT "Cosigner_cosignerId_fkey" FOREIGN KEY ("cosignerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
