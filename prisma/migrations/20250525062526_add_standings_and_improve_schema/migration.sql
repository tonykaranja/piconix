/*
  Warnings:

  - The primary key for the `Circuit` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Circuit` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `Constructor` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `name` on the `Constructor` table. All the data in the column will be lost.
  - The primary key for the `Driver` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Driver` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The primary key for the `PitStop` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `QualifyingResult` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Result` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[id]` on the table `Constructor` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `Name` to the `Constructor` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `Constructor` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `driverId` on the `PitStop` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `driverId` on the `QualifyingResult` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `constructorId` on the `QualifyingResult` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `circuitId` on the `Race` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `driverId` on the `Result` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `constructorId` on the `Result` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- DropForeignKey
ALTER TABLE "PitStop" DROP CONSTRAINT "PitStop_driverId_fkey";

-- DropForeignKey
ALTER TABLE "QualifyingResult" DROP CONSTRAINT "QualifyingResult_constructorId_constructorYear_fkey";

-- DropForeignKey
ALTER TABLE "QualifyingResult" DROP CONSTRAINT "QualifyingResult_driverId_fkey";

-- DropForeignKey
ALTER TABLE "Race" DROP CONSTRAINT "Race_circuitId_fkey";

-- DropForeignKey
ALTER TABLE "Result" DROP CONSTRAINT "Result_constructorId_constructorYear_fkey";

-- DropForeignKey
ALTER TABLE "Result" DROP CONSTRAINT "Result_driverId_fkey";

-- DropIndex
DROP INDEX "Constructor_name_idx";

-- AlterTable
ALTER TABLE "Circuit" DROP CONSTRAINT "Circuit_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Circuit_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Constructor" DROP CONSTRAINT "Constructor_pkey",
DROP COLUMN "name",
ADD COLUMN     "Name" TEXT NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" INTEGER NOT NULL,
ADD CONSTRAINT "Constructor_pkey" PRIMARY KEY ("id", "year");

-- AlterTable
ALTER TABLE "Driver" DROP CONSTRAINT "Driver_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Driver_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "PitStop" DROP CONSTRAINT "PitStop_pkey",
ADD COLUMN     "circuitId" INTEGER,
DROP COLUMN "driverId",
ADD COLUMN     "driverId" INTEGER NOT NULL,
ADD CONSTRAINT "PitStop_pkey" PRIMARY KEY ("season", "round", "driverId", "stop");

-- AlterTable
ALTER TABLE "QualifyingResult" DROP CONSTRAINT "QualifyingResult_pkey",
ADD COLUMN     "circuitId" INTEGER,
DROP COLUMN "driverId",
ADD COLUMN     "driverId" INTEGER NOT NULL,
DROP COLUMN "constructorId",
ADD COLUMN     "constructorId" INTEGER NOT NULL,
ADD CONSTRAINT "QualifyingResult_pkey" PRIMARY KEY ("season", "round", "driverId");

-- AlterTable
ALTER TABLE "Race" DROP COLUMN "circuitId",
ADD COLUMN     "circuitId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Result" DROP CONSTRAINT "Result_pkey",
ADD COLUMN     "circuitId" INTEGER,
DROP COLUMN "driverId",
ADD COLUMN     "driverId" INTEGER NOT NULL,
DROP COLUMN "constructorId",
ADD COLUMN     "constructorId" INTEGER NOT NULL,
ADD CONSTRAINT "Result_pkey" PRIMARY KEY ("season", "round", "driverId");

-- CreateTable
CREATE TABLE "DriverStanding" (
    "season" INTEGER NOT NULL,
    "round" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "points" DOUBLE PRECISION NOT NULL,
    "wins" INTEGER NOT NULL,
    "driverId" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "DriverStanding_pkey" PRIMARY KEY ("season","round","driverId")
);

-- CreateTable
CREATE TABLE "ConstructorStanding" (
    "season" INTEGER NOT NULL,
    "round" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "points" DOUBLE PRECISION NOT NULL,
    "wins" INTEGER NOT NULL,
    "constructorId" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ConstructorStanding_pkey" PRIMARY KEY ("season","round","constructorId")
);

-- CreateIndex
CREATE INDEX "DriverStanding_position_idx" ON "DriverStanding"("position");

-- CreateIndex
CREATE INDEX "DriverStanding_points_idx" ON "DriverStanding"("points");

-- CreateIndex
CREATE INDEX "DriverStanding_driverId_season_round_idx" ON "DriverStanding"("driverId", "season", "round");

-- CreateIndex
CREATE INDEX "ConstructorStanding_position_idx" ON "ConstructorStanding"("position");

-- CreateIndex
CREATE INDEX "ConstructorStanding_points_idx" ON "ConstructorStanding"("points");

-- CreateIndex
CREATE INDEX "ConstructorStanding_constructorId_season_round_idx" ON "ConstructorStanding"("constructorId", "season", "round");

-- CreateIndex
CREATE UNIQUE INDEX "Constructor_id_key" ON "Constructor"("id");

-- CreateIndex
CREATE INDEX "Constructor_Name_idx" ON "Constructor"("Name");

-- CreateIndex
CREATE INDEX "PitStop_driverId_season_round_idx" ON "PitStop"("driverId", "season", "round");

-- CreateIndex
CREATE INDEX "QualifyingResult_driverId_season_round_idx" ON "QualifyingResult"("driverId", "season", "round");

-- CreateIndex
CREATE INDEX "QualifyingResult_constructorId_constructorYear_season_round_idx" ON "QualifyingResult"("constructorId", "constructorYear", "season", "round");

-- CreateIndex
CREATE INDEX "Race_circuitId_idx" ON "Race"("circuitId");

-- CreateIndex
CREATE INDEX "Result_driverId_season_round_idx" ON "Result"("driverId", "season", "round");

-- CreateIndex
CREATE INDEX "Result_constructorId_constructorYear_season_round_idx" ON "Result"("constructorId", "constructorYear", "season", "round");

-- AddForeignKey
ALTER TABLE "Race" ADD CONSTRAINT "Race_circuitId_fkey" FOREIGN KEY ("circuitId") REFERENCES "Circuit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_constructorId_constructorYear_fkey" FOREIGN KEY ("constructorId", "constructorYear") REFERENCES "Constructor"("id", "year") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_circuitId_fkey" FOREIGN KEY ("circuitId") REFERENCES "Circuit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PitStop" ADD CONSTRAINT "PitStop_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PitStop" ADD CONSTRAINT "PitStop_circuitId_fkey" FOREIGN KEY ("circuitId") REFERENCES "Circuit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualifyingResult" ADD CONSTRAINT "QualifyingResult_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualifyingResult" ADD CONSTRAINT "QualifyingResult_constructorId_constructorYear_fkey" FOREIGN KEY ("constructorId", "constructorYear") REFERENCES "Constructor"("id", "year") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualifyingResult" ADD CONSTRAINT "QualifyingResult_circuitId_fkey" FOREIGN KEY ("circuitId") REFERENCES "Circuit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverStanding" ADD CONSTRAINT "DriverStanding_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverStanding" ADD CONSTRAINT "DriverStanding_season_round_fkey" FOREIGN KEY ("season", "round") REFERENCES "Race"("season", "round") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructorStanding" ADD CONSTRAINT "ConstructorStanding_constructorId_fkey" FOREIGN KEY ("constructorId") REFERENCES "Constructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConstructorStanding" ADD CONSTRAINT "ConstructorStanding_season_round_fkey" FOREIGN KEY ("season", "round") REFERENCES "Race"("season", "round") ON DELETE RESTRICT ON UPDATE CASCADE;
