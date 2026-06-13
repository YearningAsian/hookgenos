-- CreateTable
CREATE TABLE "boards" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#9333ea',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "boards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "board_hooks" (
    "id" TEXT NOT NULL,
    "boardId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "hookType" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "niche" TEXT,
    "sourceHandle" TEXT,
    "sourceViews" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "board_hooks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "boards_userId_idx" ON "boards"("userId");

-- CreateIndex
CREATE INDEX "boards_userId_updatedAt_idx" ON "boards"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "board_hooks_boardId_idx" ON "board_hooks"("boardId");

-- CreateIndex
CREATE INDEX "board_hooks_boardId_createdAt_idx" ON "board_hooks"("boardId", "createdAt");

-- AddForeignKey
ALTER TABLE "boards" ADD CONSTRAINT "boards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "board_hooks" ADD CONSTRAINT "board_hooks_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;
