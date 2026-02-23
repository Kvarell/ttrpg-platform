-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_campaignId_fkey";

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
