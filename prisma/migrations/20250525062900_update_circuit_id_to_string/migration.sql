/*
  Warnings:

  - The primary key for the `Circuit` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "PitStop" DROP CONSTRAINT "PitStop_circuitId_fkey";

-- DropForeignKey
ALTER TABLE "QualifyingResult" DROP CONSTRAINT "QualifyingResult_circuitId_fkey";

-- DropForeignKey
ALTER TABLE "Race" DROP CONSTRAINT "Race_circuitId_fkey";

-- DropForeignKey
ALTER TABLE "Result" DROP CONSTRAINT "Result_circuitId_fkey";

-- AlterTable
ALTER TABLE "Circuit" DROP CONSTRAINT "Circuit_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "Circuit_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Circuit_id_seq";

-- AlterTable
ALTER TABLE "PitStop" ALTER COLUMN "circuitId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "QualifyingResult" ALTER COLUMN "circuitId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Race" ALTER COLUMN "circuitId" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "Result" ALTER COLUMN "circuitId" SET DATA TYPE TEXT;

-- AddForeignKey
ALTER TABLE "Race" ADD CONSTRAINT "Race_circuitId_fkey" FOREIGN KEY ("circuitId") REFERENCES "Circuit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_circuitId_fkey" FOREIGN KEY ("circuitId") REFERENCES "Circuit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PitStop" ADD CONSTRAINT "PitStop_circuitId_fkey" FOREIGN KEY ("circuitId") REFERENCES "Circuit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualifyingResult" ADD CONSTRAINT "QualifyingResult_circuitId_fkey" FOREIGN KEY ("circuitId") REFERENCES "Circuit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
