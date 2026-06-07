-- CreateEnum
CREATE TYPE "LeaseType" AS ENUM ('MTM', 'M6', 'M12', 'CUSTOM');

-- CreateTable
CREATE TABLE "Listing" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "dateCreated" TIMESTAMP(3) NOT NULL,
    "location" JSONB NOT NULL,
    "leaseType" "LeaseType" NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);
