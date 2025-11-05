-- CreateTable
CREATE TABLE "integration_configs" (
    "id" TEXT NOT NULL,
    "boardId" TEXT,
    "organizationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "webhookUrl" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "events" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "integration_configs_organizationId_idx" ON "integration_configs"("organizationId");

-- CreateIndex
CREATE INDEX "integration_configs_boardId_idx" ON "integration_configs"("boardId");

-- CreateIndex
CREATE INDEX "integration_configs_enabled_idx" ON "integration_configs"("enabled");

-- CreateIndex
CREATE INDEX "integration_configs_type_idx" ON "integration_configs"("type");
