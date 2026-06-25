-- Flatten Location, Pricing, RoomInfo, Requirement, and Amenity into listings.

-- AlterTable
ALTER TABLE "listings" ADD COLUMN "address" TEXT,
ADD COLUMN "apartmentUnit" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "zip" TEXT,
ADD COLUMN "neighborhood" TEXT,
ADD COLUMN "latitude" DOUBLE PRECISION,
ADD COLUMN "longitude" DOUBLE PRECISION,
ADD COLUMN "distanceToCampus" DOUBLE PRECISION,
ADD COLUMN "hideExactAddress" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "monthlyRent" INTEGER,
ADD COLUMN "deposit" INTEGER,
ADD COLUMN "applicationFee" INTEGER,
ADD COLUMN "utilitiesIncluded" BOOLEAN,
ADD COLUMN "leaseType" "LeaseType",
ADD COLUMN "moveInDate" TIMESTAMP(3),
ADD COLUMN "moveOutDate" TIMESTAMP(3),
ADD COLUMN "numberOfRooms" INTEGER,
ADD COLUMN "roomType" "RoomType",
ADD COLUMN "bathroomType" "BathroomType",
ADD COLUMN "roommateCount" INTEGER,
ADD COLUMN "roommatesAllowed" BOOLEAN,
ADD COLUMN "maxOccupants" INTEGER,
ADD COLUMN "incomeRequirement" INTEGER,
ADD COLUMN "creditScoreMinimum" INTEGER,
ADD COLUMN "backgroundCheck" BOOLEAN,
ADD COLUMN "petsAllowed" BOOLEAN,
ADD COLUMN "smokingAllowed" BOOLEAN,
ADD COLUMN "quietHours" TEXT,
ADD COLUMN "furnished" BOOLEAN,
ADD COLUMN "laundry" BOOLEAN,
ADD COLUMN "parking" BOOLEAN,
ADD COLUMN "wifiIncluded" BOOLEAN,
ADD COLUMN "gasIncluded" BOOLEAN,
ADD COLUMN "waterIncluded" BOOLEAN;

-- Backfill from child tables
UPDATE "listings" l
SET
  "address" = loc."address",
  "apartmentUnit" = loc."apartmentUnit",
  "city" = loc."city",
  "zip" = loc."zip",
  "neighborhood" = loc."neighborhood",
  "latitude" = loc."latitude",
  "longitude" = loc."longitude",
  "distanceToCampus" = loc."distanceToCampus",
  "hideExactAddress" = loc."hideExactAddress"
FROM "Location" loc
WHERE loc."listingId" = l."id";

UPDATE "listings" l
SET
  "monthlyRent" = p."monthlyRent",
  "deposit" = p."deposit",
  "applicationFee" = p."applicationFee",
  "utilitiesIncluded" = p."utilitiesIncluded",
  "leaseType" = p."leaseType",
  "moveInDate" = p."moveInDate",
  "moveOutDate" = p."moveOutDate"
FROM "Pricing" p
WHERE p."listingId" = l."id";

UPDATE "listings" l
SET
  "numberOfRooms" = r."numberOfRooms",
  "roomType" = r."roomType",
  "bathroomType" = r."bathroomType",
  "roommateCount" = r."roommateCount"
FROM "RoomInfo" r
WHERE r."listingId" = l."id";

UPDATE "listings" l
SET
  "roommatesAllowed" = req."roommatesAllowed",
  "maxOccupants" = req."maxOccupants",
  "incomeRequirement" = req."incomeRequirement",
  "creditScoreMinimum" = req."creditScoreMinimum",
  "backgroundCheck" = req."backgroundCheck",
  "petsAllowed" = req."petsAllowed",
  "smokingAllowed" = req."smokingAllowed",
  "quietHours" = req."quietHours"
FROM "Requirement" req
WHERE req."listingId" = l."id";

UPDATE "listings" l
SET
  "furnished" = a."furnished",
  "laundry" = a."laundry",
  "parking" = a."parking",
  "wifiIncluded" = a."wifiIncluded",
  "gasIncluded" = a."gasIncluded",
  "waterIncluded" = a."waterIncluded"
FROM "Amenity" a
WHERE a."listingId" = l."id";

-- DropForeignKey
ALTER TABLE "Amenity" DROP CONSTRAINT "Amenity_listingId_fkey";
ALTER TABLE "Location" DROP CONSTRAINT "Location_listingId_fkey";
ALTER TABLE "Pricing" DROP CONSTRAINT "Pricing_listingId_fkey";
ALTER TABLE "Requirement" DROP CONSTRAINT "Requirement_listingId_fkey";
ALTER TABLE "RoomInfo" DROP CONSTRAINT "RoomInfo_listingId_fkey";

-- DropTable
DROP TABLE "Amenity";
DROP TABLE "Location";
DROP TABLE "Pricing";
DROP TABLE "Requirement";
DROP TABLE "RoomInfo";

-- CreateIndex
CREATE INDEX "listings_city_idx" ON "listings"("city");
CREATE INDEX "listings_monthlyRent_idx" ON "listings"("monthlyRent");
