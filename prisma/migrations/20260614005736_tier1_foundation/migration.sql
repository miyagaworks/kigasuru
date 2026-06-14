-- AlterTable
ALTER TABLE "Shot" ADD COLUMN     "clientId" TEXT,
ADD COLUMN     "holeNumber" INTEGER,
ADD COLUMN     "roundId" TEXT,
ALTER COLUMN "distance" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "golfCourse" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "temperature" TEXT,
    "actualTemperature" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Round_userId_date_idx" ON "Round"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Shot_clientId_key" ON "Shot"("clientId");

-- CreateIndex
CREATE INDEX "Shot_roundId_idx" ON "Shot"("roundId");

-- AddForeignKey
ALTER TABLE "Shot" ADD CONSTRAINT "Shot_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "Round"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable RLS on new table (manual; Prisma does not generate this)
ALTER TABLE "Round" ENABLE ROW LEVEL SECURITY;

