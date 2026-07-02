-- AlterTable: Plaid access tokens are stored server-side, never sent to the client
ALTER TABLE "User" ADD COLUMN     "plaidAccessToken" TEXT;
