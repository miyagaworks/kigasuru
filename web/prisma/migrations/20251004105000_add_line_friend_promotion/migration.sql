-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lineFriendAdded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lineFriendAddedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "LinePromotion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lineUserId" TEXT,
    "promotionApplied" BOOLEAN NOT NULL DEFAULT false,
    "appliedAt" TIMESTAMP(3),
    "promotionDays" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LinePromotion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LinePromotion_userId_idx" ON "LinePromotion"("userId");

-- CreateIndex
CREATE INDEX "LinePromotion_lineUserId_idx" ON "LinePromotion"("lineUserId");

-- CreateIndex
CREATE UNIQUE INDEX "LinePromotion_userId_key" ON "LinePromotion"("userId");

-- AddForeignKey
ALTER TABLE "LinePromotion" ADD CONSTRAINT "LinePromotion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
