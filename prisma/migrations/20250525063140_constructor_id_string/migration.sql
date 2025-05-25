/*
  Warnings:

  - The primary key for the `Constructor` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ConstructorStanding` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `constructorYear` to the `ConstructorStanding` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ConstructorStanding" DROP CONSTRAINT "ConstructorStanding_constructorId_fkey";

-- DropForeignKey
ALTER TABLE "QualifyingResult" DROP CONSTRAINT "QualifyingResult_constructorId_constructorYear_fkey";

-- DropForeignKey
ALTER TABLE "Result" DROP CONSTRAINT "Result_constructorId_constructorYear_fkey";

-- DropIndex
DROP INDEX "Constructor_id_key";

-- DropIndex
DROP INDEX "ConstructorStanding_constructorId_season_round_idx";

-- AlterTable
ALTER TABLE "Constructor" DROP CONSTRAINT "Constructor_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Constructor_pkey" PRIMARY KEY ("id", "year");

-- AlterTable
ALTER TABLE "ConstructorStanding" DROP CONSTRAINT "ConstructorStanding_pkey",
ADD COLUMN     "constructorYear" INTEGER NOT NULL,
ALTER COLUMN "constructorId" SET DATA TYPE TEXT,
ADD CONSTRAINT "ConstructorStanding_pkey" PRIMARY KEY ("season", "round", "constructorId", "constructorYear");

-- AlterTable
ALTER TABLE "QualifyingResult" ALTER COLUMN "constructorId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Result" ALTER COLUMN "constructorId" SET DATA TYPE TEXT;

-- CreateIndex
CREATE INDEX "ConstructorStanding_constructorId_constructorYear_season_ro_idx" ON "ConstructorStanding"("constructorId", "constructorYear", "season", "round");

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_constructorId_constructorYear_fkey" FOREIGN KEY ("constructorId", "constructorYear") REFERENCES "Constructor"("id", "year") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualifyingResult" ADD CONSTRAINT "QualifyingResult_constructorId_constructorYear_fkey" FOREIGN KEY ("constructorId", "constructorYear") REFERENCES "Constructor"("id", "year") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructorStanding" ADD CONSTRAINT "ConstructorStanding_constructorId_constructorYear_fkey" FOREIGN KEY ("constructorId", "constructorYear") REFERENCES "Constructor"("id", "year") ON DELETE RESTRICT ON UPDATE CASCADE;
