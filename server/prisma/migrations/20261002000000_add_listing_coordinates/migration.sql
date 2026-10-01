-- Listings: optional exact street address plus geocoded coordinates so the
-- Browse map can pin them. Existing listings keep NULLs and are pinned at
-- their neighborhood center until the landlord adds an address.

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "streetAddress" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "Listing_latitude_longitude_idx" ON "Listing"("latitude", "longitude");
