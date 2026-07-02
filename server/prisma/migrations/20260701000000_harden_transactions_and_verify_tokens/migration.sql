-- AlterTable: allow pre-application transactions (application fee is charged
-- at pre-qualification, before any Application row exists)
ALTER TABLE "Transaction" ALTER COLUMN "applicationId" DROP NOT NULL;

-- AlterTable: email verification tokens now expire
ALTER TABLE "User" ADD COLUMN     "verifyTokenExp" TIMESTAMP(3);
