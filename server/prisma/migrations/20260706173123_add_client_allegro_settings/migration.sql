-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "allegroImpliedWarrantyName" TEXT,
ADD COLUMN     "allegroReturnPolicyName" TEXT;

-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "clientId" TEXT,
ADD COLUMN     "deliveryHint" TEXT;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
