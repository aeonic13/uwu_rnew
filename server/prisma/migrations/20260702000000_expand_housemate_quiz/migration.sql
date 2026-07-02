-- AlterTable: expand the housemate compatibility quiz with the dimensions
-- roommate-conflict research ranks highest (smoking/pets dealbreakers,
-- sharing, social style, chores, conflict style)
ALTER TABLE "HousemateProfile" ADD COLUMN     "smoking" TEXT,
ADD COLUMN     "pets" TEXT,
ADD COLUMN     "socialStyle" TEXT,
ADD COLUMN     "sharing" TEXT,
ADD COLUMN     "chores" TEXT,
ADD COLUMN     "conflictStyle" TEXT;
