-- AlterTable
ALTER TABLE "Session" ADD COLUMN "system" TEXT;

-- DropIndex
DROP INDEX "Session_date_idx";

-- CreateIndex
CREATE INDEX "Session_date_system_idx" ON "Session"("date", "system");
