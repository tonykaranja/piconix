/*
  Warnings:

  - The primary key for the `Constructor` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Added the required column `constructorYear` to the `QualifyingResult` table without a default value. This is not possible if the table is not empty.
  - Added the required column `constructorYear` to the `Result` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "QualifyingResult" DROP CONSTRAINT "QualifyingResult_constructorId_fkey";

-- DropForeignKey
ALTER TABLE "Result" DROP CONSTRAINT "Result_constructorId_fkey";

-- DropIndex
DROP INDEX "Constructor_id_year_key";

-- DropIndex
DROP INDEX "QualifyingResult_constructorId_season_round_idx";

-- DropIndex
DROP INDEX "Result_constructorId_season_round_idx";

-- AlterTable
ALTER TABLE "Constructor" DROP CONSTRAINT "Constructor_pkey",
ADD CONSTRAINT "Constructor_pkey" PRIMARY KEY ("id", "year");

-- AlterTable
ALTER TABLE "QualifyingResult" ADD COLUMN     "constructorYear" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Result" ADD COLUMN     "constructorYear" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "QualifyingResult_constructorId_constructorYear_season_round_idx" ON "QualifyingResult"("constructorId", "constructorYear", "season", "round");

-- CreateIndex
CREATE INDEX "Result_constructorId_constructorYear_season_round_idx" ON "Result"("constructorId", "constructorYear", "season", "round");

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_constructorId_constructorYear_fkey" FOREIGN KEY ("constructorId", "constructorYear") REFERENCES "Constructor"("id", "year") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualifyingResult" ADD CONSTRAINT "QualifyingResult_constructorId_constructorYear_fkey" FOREIGN KEY ("constructorId", "constructorYear") REFERENCES "Constructor"("id", "year") ON DELETE RESTRICT ON UPDATE CASCADE;
