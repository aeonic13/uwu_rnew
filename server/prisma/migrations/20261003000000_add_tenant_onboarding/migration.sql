-- Onboarding existing tenants to an occupied property.
-- Applications gain a source (applied | onboarded) and a nullable applicant;
-- agreements gain a source (rentra | imported) and a month-to-month flag;
-- a lease's tenant signature blocks may be unattached until the tenant
-- accepts their TenantInvite. No backfill: every existing row keeps the
-- defaults (applied / rentra / false).

-- CreateEnum
CREATE TYPE "ApplicationSource" AS ENUM ('applied', 'onboarded');

-- CreateEnum
CREATE TYPE "AgreementSource" AS ENUM ('rentra', 'imported');

-- CreateEnum
CREATE TYPE "TenantInviteStatus" AS ENUM ('pending', 'accepted', 'declined', 'expired', 'cancelled');

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "source" "ApplicationSource" NOT NULL DEFAULT 'applied',
ALTER COLUMN "applicantId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Agreement" ADD COLUMN     "monthToMonth" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "source" "AgreementSource" NOT NULL DEFAULT 'rentra';

-- AlterTable
ALTER TABLE "AgreementSigner" ALTER COLUMN "userId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "TenantInvite" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT,
    "status" "TenantInviteStatus" NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "listingId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "agreementId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "acceptedUserId" TEXT,

    CONSTRAINT "TenantInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TenantInvite_token_key" ON "TenantInvite"("token");

-- CreateIndex
CREATE UNIQUE INDEX "TenantInvite_applicationId_key" ON "TenantInvite"("applicationId");

-- CreateIndex
CREATE INDEX "TenantInvite_email_idx" ON "TenantInvite"("email");

-- CreateIndex
CREATE INDEX "TenantInvite_listingId_idx" ON "TenantInvite"("listingId");

-- CreateIndex
CREATE INDEX "TenantInvite_ownerId_idx" ON "TenantInvite"("ownerId");

-- CreateIndex
CREATE INDEX "TenantInvite_agreementId_idx" ON "TenantInvite"("agreementId");

-- CreateIndex
CREATE INDEX "TenantInvite_status_idx" ON "TenantInvite"("status");

-- AddForeignKey
ALTER TABLE "TenantInvite" ADD CONSTRAINT "TenantInvite_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantInvite" ADD CONSTRAINT "TenantInvite_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantInvite" ADD CONSTRAINT "TenantInvite_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantInvite" ADD CONSTRAINT "TenantInvite_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantInvite" ADD CONSTRAINT "TenantInvite_acceptedUserId_fkey" FOREIGN KEY ("acceptedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

