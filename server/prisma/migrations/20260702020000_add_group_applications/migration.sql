-- AlterTable: applications submitted as a roommate group share a groupId
ALTER TABLE "Application" ADD COLUMN     "groupId" TEXT;

-- CreateIndex
CREATE INDEX "Application_groupId_idx" ON "Application"("groupId");

-- AddForeignKey
ALTER TABLE "Application" ADD CONSTRAINT "Application_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
