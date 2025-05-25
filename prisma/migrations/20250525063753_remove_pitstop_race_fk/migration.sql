-- DropForeignKey
ALTER TABLE "PitStop" DROP CONSTRAINT "PitStop_season_round_fkey";

-- AlterTable
ALTER TABLE "PitStop" ADD COLUMN     "raceRound" INTEGER,
ADD COLUMN     "raceSeason" INTEGER;

-- AddForeignKey
ALTER TABLE "PitStop" ADD CONSTRAINT "PitStop_raceSeason_raceRound_fkey" FOREIGN KEY ("raceSeason", "raceRound") REFERENCES "Race"("season", "round") ON DELETE SET NULL ON UPDATE CASCADE;
