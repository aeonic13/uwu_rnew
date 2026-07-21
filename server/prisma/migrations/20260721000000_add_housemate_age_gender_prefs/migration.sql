-- AlterTable: add Hinge-style discovery fields to housemate profiles.
-- "About you" (age, gender) makes profiles filterable; the preference columns
-- store the age range + gender the person wants in a desired roommate.
ALTER TABLE "HousemateProfile" ADD COLUMN     "age" INTEGER,
ADD COLUMN     "gender" TEXT,
ADD COLUMN     "agePreferenceMin" INTEGER,
ADD COLUMN     "agePreferenceMax" INTEGER,
ADD COLUMN     "genderPreference" TEXT;
