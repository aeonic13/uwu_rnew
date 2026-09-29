-- Housemates: replace the free-text locality with a city plus the
-- neighborhoods someone would consider. Existing profiles that mention a
-- known San Diego neighborhood or the city itself are backfilled.

-- AlterTable
ALTER TABLE "HousemateProfile" ADD COLUMN     "city" TEXT,
ADD COLUMN     "areas" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "HousemateProfile_city_idx" ON "HousemateProfile"("city");

-- Backfill city for the seed / early profiles (all San Diego so far).
UPDATE "HousemateProfile"
SET "city" = 'San Diego'
WHERE "city" IS NULL
  AND "location" IS NOT NULL
  AND (
    "location" ILIKE '%San Diego%'
    OR "location" ILIKE '%La Jolla%'
    OR "location" ILIKE '%Pacific Beach%'
    OR "location" ILIKE '%Mission Beach%'
    OR "location" ILIKE '%Ocean Beach%'
    OR "location" ILIKE '%North Park%'
    OR "location" ILIKE '%Hillcrest%'
    OR "location" ILIKE '%Mission Valley%'
    OR "location" ILIKE '%University City%'
    OR "location" ILIKE '%UTC%'
  );
