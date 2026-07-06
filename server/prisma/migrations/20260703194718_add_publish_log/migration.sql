-- CreateEnum
CREATE TYPE "PublishLogStatus" AS ENUM ('SUCCESS', 'ERROR');

-- CreateTable
CREATE TABLE "PublishLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listingId" TEXT,
    "platform" "Platform" NOT NULL,
    "status" "PublishLogStatus" NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublishLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PublishLog_userId_createdAt_idx" ON "PublishLog"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "PublishLog" ADD CONSTRAINT "PublishLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
