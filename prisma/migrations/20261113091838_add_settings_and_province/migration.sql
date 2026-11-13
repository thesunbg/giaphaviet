-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "country" TEXT DEFAULT 'Việt Nam',
ADD COLUMN     "province" TEXT;

-- CreateTable
CREATE TABLE "SiteSetting" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "familyName" TEXT NOT NULL DEFAULT 'Dòng họ',
    "treeTitle" TEXT,
    "ancestralHome" TEXT,
    "address" TEXT,
    "description" TEXT,
    "contactPhone" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Member_province_idx" ON "Member"("province");
