-- CreateTable
CREATE TABLE "HousemateProfile" (
    "id" TEXT NOT NULL,
    "sleepSchedule" TEXT,
    "cleanliness" TEXT,
    "noiseTolerance" TEXT,
    "guestFrequency" TEXT,
    "audience" TEXT,
    "occupation" TEXT,
    "location" TEXT,
    "budgetMin" INTEGER,
    "budgetMax" INTEGER,
    "bio" TEXT,
    "tags" TEXT[],
    "lookingForRoom" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "HousemateProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HousemateProfile_userId_key" ON "HousemateProfile"("userId");

-- CreateIndex
CREATE INDEX "HousemateProfile_userId_idx" ON "HousemateProfile"("userId");

-- CreateIndex
CREATE INDEX "HousemateProfile_audience_idx" ON "HousemateProfile"("audience");

-- CreateIndex
CREATE INDEX "HousemateProfile_active_idx" ON "HousemateProfile"("active");

-- AddForeignKey
ALTER TABLE "HousemateProfile" ADD CONSTRAINT "HousemateProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
