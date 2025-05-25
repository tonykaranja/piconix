-- DropForeignKey
ALTER TABLE "QualifyingResult" DROP CONSTRAINT "QualifyingResult_season_round_fkey";

-- AlterTable
ALTER TABLE "QualifyingResult" ADD COLUMN     "raceRound" INTEGER,
ADD COLUMN     "raceSeason" INTEGER;

-- AddForeignKey
ALTER TABLE "QualifyingResult" ADD CONSTRAINT "QualifyingResult_raceSeason_raceRound_fkey" FOREIGN KEY ("raceSeason", "raceRound") REFERENCES "Race"("season", "round") ON DELETE SET NULL ON UPDATE CASCADE;
