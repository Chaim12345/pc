-- AlterTable
ALTER TABLE "items" ADD COLUMN     "parentId" TEXT;

-- CreateIndex
CREATE INDEX "items_parentId_idx" ON "items"("parentId");

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
