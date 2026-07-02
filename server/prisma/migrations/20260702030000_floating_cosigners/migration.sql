-- AlterTable: cosigners invited at pre-qualification have no application yet
ALTER TABLE "Cosigner" ALTER COLUMN "applicationId" DROP NOT NULL;
