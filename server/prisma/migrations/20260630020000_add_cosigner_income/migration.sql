-- AlterTable: store the guarantor's Plaid-verified qualifying income
ALTER TABLE "Cosigner" ADD COLUMN     "verifiedMonthlyIncome" DOUBLE PRECISION,
ADD COLUMN     "incomeVerifiedAt" TIMESTAMP(3);
