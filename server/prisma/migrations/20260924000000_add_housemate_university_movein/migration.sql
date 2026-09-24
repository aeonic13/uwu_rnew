-- Housemates revamp: rank and filter by university (Rentra's strongest
-- locality signal for students) and show when someone wants to move in.
ALTER TABLE "HousemateProfile" ADD COLUMN     "university" TEXT,
ADD COLUMN     "moveInMonth" TEXT;

-- CreateIndex
CREATE INDEX "HousemateProfile_university_idx" ON "HousemateProfile"("university");
