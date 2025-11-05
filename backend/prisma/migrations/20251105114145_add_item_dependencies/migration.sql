-- CreateTable
CREATE TABLE "item_dependencies" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "dependsOnId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "item_dependencies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "item_dependencies_itemId_idx" ON "item_dependencies"("itemId");

-- CreateIndex
CREATE INDEX "item_dependencies_dependsOnId_idx" ON "item_dependencies"("dependsOnId");

-- CreateIndex
CREATE INDEX "item_dependencies_type_idx" ON "item_dependencies"("type");

-- CreateIndex
CREATE UNIQUE INDEX "item_dependencies_itemId_dependsOnId_type_key" ON "item_dependencies"("itemId", "dependsOnId", "type");

-- AddForeignKey
ALTER TABLE "item_dependencies" ADD CONSTRAINT "item_dependencies_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_dependencies" ADD CONSTRAINT "item_dependencies_dependsOnId_fkey" FOREIGN KEY ("dependsOnId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
