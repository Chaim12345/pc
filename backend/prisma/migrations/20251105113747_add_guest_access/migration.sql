-- CreateTable
CREATE TABLE "guest_accesses" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "accessLevel" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAccessedAt" TIMESTAMP(3),
    "accessCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "guest_accesses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guest_accesses_token_key" ON "guest_accesses"("token");

-- CreateIndex
CREATE INDEX "guest_accesses_boardId_idx" ON "guest_accesses"("boardId");

-- CreateIndex
CREATE INDEX "guest_accesses_token_idx" ON "guest_accesses"("token");

-- CreateIndex
CREATE INDEX "guest_accesses_email_idx" ON "guest_accesses"("email");

-- CreateIndex
CREATE INDEX "guest_accesses_isActive_idx" ON "guest_accesses"("isActive");

-- CreateIndex
CREATE INDEX "guest_accesses_expiresAt_idx" ON "guest_accesses"("expiresAt");

-- AddForeignKey
ALTER TABLE "guest_accesses" ADD CONSTRAINT "guest_accesses_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
