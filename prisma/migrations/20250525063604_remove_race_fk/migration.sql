-- DropForeignKey
ALTER TABLE "Result" DROP CONSTRAINT "Result_season_round_fkey";

-- AlterTable
ALTER TABLE "Result" ADD COLUMN     "raceRound" INTEGER,
ADD COLUMN     "raceSeason" INTEGER;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_raceSeason_raceRound_fkey" FOREIGN KEY ("raceSeason", "raceRound") REFERENCES "Race"("season", "round") ON DELETE SET NULL ON UPDATE CASCADE;
