-- Household leases: one Agreement per household with a signature block per
-- tenant and the landlord (AgreementSigner). Group members share the lease
-- through Application.agreementId. Existing one-tenant agreements are
-- backfilled so nothing changes for leases already in flight.

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "agreementId" TEXT;

-- AlterTable
ALTER TABLE "Agreement" ADD COLUMN     "groupId" TEXT;

-- CreateTable
CREATE TABLE "AgreementSigner" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "signed" BOOLEAN NOT NULL DEFAULT false,
    "signedAt" TIMESTAMP(3),
    "signatureName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "agreementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "applicationId" TEXT,

    CONSTRAINT "AgreementSigner_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Application_agreementId_idx" ON "Application"("agreementId");

-- CreateIndex
CREATE UNIQUE INDEX "AgreementSigner_agreementId_userId_key" ON "AgreementSigner"("agreementId", "userId");

-- CreateIndex
CREATE INDEX "AgreementSigner_userId_idx" ON "AgreementSigner"("userId");

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgreementSigner" ADD CONSTRAINT "AgreementSigner_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "Agreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgreementSigner" ADD CONSTRAINT "AgreementSigner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: every existing agreement is a one-tenant lease on its lead
-- application. Link the application and create its two signature blocks.
UPDATE "Application" a
SET "agreementId" = ag."id"
FROM "Agreement" ag
WHERE ag."applicationId" = a."id" AND a."agreementId" IS NULL;

INSERT INTO "AgreementSigner" ("id", "role", "signed", "signedAt", "agreementId", "userId", "applicationId")
SELECT gen_random_uuid()::text, 'tenant', ag."tenantSigned", ag."tenantSignedAt", ag."id", app."applicantId", app."id"
FROM "Agreement" ag
JOIN "Application" app ON app."id" = ag."applicationId";

INSERT INTO "AgreementSigner" ("id", "role", "signed", "signedAt", "agreementId", "userId", "applicationId")
SELECT gen_random_uuid()::text, 'landlord', ag."landlordSigned", ag."landlordSignedAt", ag."id", app."ownerId", NULL
FROM "Agreement" ag
JOIN "Application" app ON app."id" = ag."applicationId";
