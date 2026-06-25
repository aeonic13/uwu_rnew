-- Tighten listing columns: core fields NOT NULL (matches createListingSchema),
-- booleans and coordinates get defaults, enrichment fields stay nullable.

-- Backfill before NOT NULL constraints
UPDATE "listings" SET "latitude" = 0 WHERE "latitude" IS NULL;
UPDATE "listings" SET "longitude" = 0 WHERE "longitude" IS NULL;
UPDATE "listings" SET "roommateCount" = 0 WHERE "roommateCount" IS NULL;

UPDATE "listings" SET "utilitiesIncluded" = false WHERE "utilitiesIncluded" IS NULL;
UPDATE "listings" SET "roommatesAllowed" = false WHERE "roommatesAllowed" IS NULL;
UPDATE "listings" SET "backgroundCheck" = false WHERE "backgroundCheck" IS NULL;
UPDATE "listings" SET "petsAllowed" = false WHERE "petsAllowed" IS NULL;
UPDATE "listings" SET "smokingAllowed" = false WHERE "smokingAllowed" IS NULL;
UPDATE "listings" SET "furnished" = false WHERE "furnished" IS NULL;
UPDATE "listings" SET "laundry" = false WHERE "laundry" IS NULL;
UPDATE "listings" SET "parking" = false WHERE "parking" IS NULL;
UPDATE "listings" SET "wifiIncluded" = false WHERE "wifiIncluded" IS NULL;
UPDATE "listings" SET "gasIncluded" = false WHERE "gasIncluded" IS NULL;
UPDATE "listings" SET "waterIncluded" = false WHERE "waterIncluded" IS NULL;

-- Drop incomplete rows that cannot satisfy core NOT NULL (dev-safe; no fake data)
DELETE FROM "listings"
WHERE "address" IS NULL
   OR "city" IS NULL
   OR "zip" IS NULL
   OR "monthlyRent" IS NULL
   OR "leaseType" IS NULL
   OR "numberOfRooms" IS NULL
   OR "roomType" IS NULL
   OR "bathroomType" IS NULL
   OR "maxOccupants" IS NULL;

-- AlterTable
ALTER TABLE "listings" ALTER COLUMN "address" SET NOT NULL,
ALTER COLUMN "city" SET NOT NULL,
ALTER COLUMN "zip" SET NOT NULL,
ALTER COLUMN "latitude" SET NOT NULL,
ALTER COLUMN "latitude" SET DEFAULT 0,
ALTER COLUMN "longitude" SET NOT NULL,
ALTER COLUMN "longitude" SET DEFAULT 0,
ALTER COLUMN "monthlyRent" SET NOT NULL,
ALTER COLUMN "utilitiesIncluded" SET NOT NULL,
ALTER COLUMN "utilitiesIncluded" SET DEFAULT false,
ALTER COLUMN "leaseType" SET NOT NULL,
ALTER COLUMN "numberOfRooms" SET NOT NULL,
ALTER COLUMN "roomType" SET NOT NULL,
ALTER COLUMN "bathroomType" SET NOT NULL,
ALTER COLUMN "roommateCount" SET NOT NULL,
ALTER COLUMN "roommateCount" SET DEFAULT 0,
ALTER COLUMN "roommatesAllowed" SET NOT NULL,
ALTER COLUMN "roommatesAllowed" SET DEFAULT false,
ALTER COLUMN "maxOccupants" SET NOT NULL,
ALTER COLUMN "backgroundCheck" SET NOT NULL,
ALTER COLUMN "backgroundCheck" SET DEFAULT false,
ALTER COLUMN "petsAllowed" SET NOT NULL,
ALTER COLUMN "petsAllowed" SET DEFAULT false,
ALTER COLUMN "smokingAllowed" SET NOT NULL,
ALTER COLUMN "smokingAllowed" SET DEFAULT false,
ALTER COLUMN "furnished" SET NOT NULL,
ALTER COLUMN "furnished" SET DEFAULT false,
ALTER COLUMN "laundry" SET NOT NULL,
ALTER COLUMN "laundry" SET DEFAULT false,
ALTER COLUMN "parking" SET NOT NULL,
ALTER COLUMN "parking" SET DEFAULT false,
ALTER COLUMN "wifiIncluded" SET NOT NULL,
ALTER COLUMN "wifiIncluded" SET DEFAULT false,
ALTER COLUMN "gasIncluded" SET NOT NULL,
ALTER COLUMN "gasIncluded" SET DEFAULT false,
ALTER COLUMN "waterIncluded" SET NOT NULL,
ALTER COLUMN "waterIncluded" SET DEFAULT false;
