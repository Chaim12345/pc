-- CreateTable
CREATE TABLE "board_permissions" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "userId" TEXT,
    "teamId" TEXT,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "board_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "board_permissions_boardId_idx" ON "board_permissions"("boardId");

-- CreateIndex
CREATE INDEX "board_permissions_userId_idx" ON "board_permissions"("userId");

-- CreateIndex
CREATE INDEX "board_permissions_teamId_idx" ON "board_permissions"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "board_permissions_boardId_userId_key" ON "board_permissions"("boardId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "board_permissions_boardId_teamId_key" ON "board_permissions"("boardId", "teamId");

-- AddForeignKey
ALTER TABLE "board_permissions" ADD CONSTRAINT "board_permissions_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_permissions" ADD CONSTRAINT "board_permissions_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
