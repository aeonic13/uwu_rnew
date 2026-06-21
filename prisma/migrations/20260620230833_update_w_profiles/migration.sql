/*
  Warnings:

  - You are about to drop the `propManager` table. If the table is not empty, all the data it contains will be lost.
  - Changed the type of `propManagerId` on the `listings` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PROPMANAGER', 'RENTER');

-- DropForeignKey
ALTER TABLE "listings" DROP CONSTRAINT "listings_propManagerId_fkey";

-- AlterTable
ALTER TABLE "listings" DROP COLUMN "propManagerId",
ADD COLUMN     "propManagerId" UUID NOT NULL;

-- DropTable
DROP TABLE "propManager";

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "roles" "UserRole"[] DEFAULT ARRAY['RENTER']::"UserRole"[],
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prop_manager_profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prop_manager_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "renter_profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "renter_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "prop_manager_profiles_userId_key" ON "prop_manager_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "renter_profiles_userId_key" ON "renter_profiles"("userId");

-- CreateIndex
CREATE INDEX "listings_propManagerId_idx" ON "listings"("propManagerId");

-- AddForeignKey
ALTER TABLE "prop_manager_profiles" ADD CONSTRAINT "prop_manager_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "renter_profiles" ADD CONSTRAINT "renter_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_propManagerId_fkey" FOREIGN KEY ("propManagerId") REFERENCES "prop_manager_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
