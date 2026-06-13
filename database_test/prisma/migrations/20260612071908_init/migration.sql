-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LeaseType" AS ENUM ('MONTH_TO_MONTH', 'SIX_MONTH', 'TWELVE_MONTH', 'CUSTOM');

-- CreateEnum
CREATE TYPE "RoomType" AS ENUM ('PRIVATE', 'SHARED');

-- CreateEnum
CREATE TYPE "BathroomType" AS ENUM ('PRIVATE', 'SHARED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "isCover" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Requirement" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "roommatesAllowed" BOOLEAN NOT NULL,
    "maxOccupants" INTEGER NOT NULL,
    "incomeRequirement" INTEGER,
    "creditScoreMinimum" INTEGER,
    "backgroundCheck" BOOLEAN NOT NULL,
    "petsAllowed" BOOLEAN NOT NULL,
    "smokingAllowed" BOOLEAN NOT NULL,
    "quietHours" TEXT,

    CONSTRAINT "Requirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "apartmentUnit" TEXT,
    "city" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "neighborhood" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "distanceToCampus" DOUBLE PRECISION,
    "hideExactAddress" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pricing" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "monthlyRent" INTEGER NOT NULL,
    "deposit" INTEGER,
    "applicationFee" INTEGER,
    "utilitiesIncluded" BOOLEAN NOT NULL,
    "leaseType" "LeaseType" NOT NULL,
    "moveInDate" TIMESTAMP(3),
    "moveOutDate" TIMESTAMP(3),

    CONSTRAINT "Pricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomInfo" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "numberOfRooms" INTEGER NOT NULL,
    "roomType" "RoomType" NOT NULL,
    "bathroomType" "BathroomType" NOT NULL,
    "roommateCount" INTEGER NOT NULL,

    CONSTRAINT "RoomInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Amenity" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "furnished" BOOLEAN NOT NULL,
    "laundry" BOOLEAN NOT NULL,
    "parking" BOOLEAN NOT NULL,
    "wifiIncluded" BOOLEAN NOT NULL,
    "gasIncluded" BOOLEAN NOT NULL,
    "waterIncluded" BOOLEAN NOT NULL,

    CONSTRAINT "Amenity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Requirement_listingId_key" ON "Requirement"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "Location_listingId_key" ON "Location"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "Pricing_listingId_key" ON "Pricing"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "RoomInfo_listingId_key" ON "RoomInfo"("listingId");

-- CreateIndex
CREATE UNIQUE INDEX "Amenity_listingId_key" ON "Amenity"("listingId");

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Requirement" ADD CONSTRAINT "Requirement_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pricing" ADD CONSTRAINT "Pricing_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomInfo" ADD CONSTRAINT "RoomInfo_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Amenity" ADD CONSTRAINT "Amenity_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
