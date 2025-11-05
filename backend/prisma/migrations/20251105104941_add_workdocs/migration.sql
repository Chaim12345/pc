-- CreateTable
CREATE TABLE "workdocs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workdocs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "workdocs_organizationId_idx" ON "workdocs"("organizationId");

-- CreateIndex
CREATE INDEX "workdocs_createdById_idx" ON "workdocs"("createdById");

-- CreateIndex
CREATE INDEX "workdocs_updatedAt_idx" ON "workdocs"("updatedAt");

-- AddForeignKey
ALTER TABLE "workdocs" ADD CONSTRAINT "workdocs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workdocs" ADD CONSTRAINT "workdocs_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
