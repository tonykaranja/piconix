/*
  Warnings:

  - The primary key for the `Driver` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `DriverStanding` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `PitStop` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `QualifyingResult` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Result` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "DriverStanding" DROP CONSTRAINT "DriverStanding_driverId_fkey";

-- DropForeignKey
ALTER TABLE "PitStop" DROP CONSTRAINT "PitStop_driverId_fkey";

-- DropForeignKey
ALTER TABLE "QualifyingResult" DROP CONSTRAINT "QualifyingResult_driverId_fkey";

-- DropForeignKey
ALTER TABLE "Result" DROP CONSTRAINT "Result_driverId_fkey";

-- AlterTable
ALTER TABLE "Driver" DROP CONSTRAINT "Driver_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Driver_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Driver_id_seq";

-- AlterTable
ALTER TABLE "DriverStanding" DROP CONSTRAINT "DriverStanding_pkey",
ALTER COLUMN "driverId" SET DATA TYPE TEXT,
ADD CONSTRAINT "DriverStanding_pkey" PRIMARY KEY ("season", "round", "driverId");

-- AlterTable
ALTER TABLE "PitStop" DROP CONSTRAINT "PitStop_pkey",
ALTER COLUMN "driverId" SET DATA TYPE TEXT,
ADD CONSTRAINT "PitStop_pkey" PRIMARY KEY ("season", "round", "driverId", "stop");

-- AlterTable
ALTER TABLE "QualifyingResult" DROP CONSTRAINT "QualifyingResult_pkey",
ALTER COLUMN "driverId" SET DATA TYPE TEXT,
ADD CONSTRAINT "QualifyingResult_pkey" PRIMARY KEY ("season", "round", "driverId");

-- AlterTable
ALTER TABLE "Result" DROP CONSTRAINT "Result_pkey",
ALTER COLUMN "driverId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Result_pkey" PRIMARY KEY ("season", "round", "driverId");

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PitStop" ADD CONSTRAINT "PitStop_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualifyingResult" ADD CONSTRAINT "QualifyingResult_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DriverStanding" ADD CONSTRAINT "DriverStanding_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
