-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "reminderMinutes" INTEGER,
ADD COLUMN     "reminderNotificationId" TEXT;

-- CreateIndex
CREATE INDEX "Note_userId_updatedAt_idx" ON "Note"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "Note_userId_archived_pinned_idx" ON "Note"("userId", "archived", "pinned");
