-- CreateTable
CREATE TABLE "Logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stack" TEXT NOT NULL,
    "meta" JSONB,
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionAnswer" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "QuestionAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Circuit" (
    "id" TEXT NOT NULL,
    "url" TEXT,
    "circuitName" TEXT NOT NULL,
    "locality" TEXT,
    "country" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Circuit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Constructor" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "url" TEXT,
    "name" TEXT NOT NULL,
    "nationality" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Constructor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Driver" (
    "id" TEXT NOT NULL,
    "url" TEXT,
    "givenName" TEXT NOT NULL,
    "familyName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "nationality" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Driver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Race" (
    "season" INTEGER NOT NULL,
    "round" INTEGER NOT NULL,
    "circuitId" TEXT NOT NULL,
    "raceDate" TIMESTAMP(3),
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Race_pkey" PRIMARY KEY ("season","round")
);

-- CreateTable
CREATE TABLE "Result" (
    "season" INTEGER NOT NULL,
    "round" INTEGER NOT NULL,
    "driverId" TEXT NOT NULL,
    "constructorId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "points" DOUBLE PRECISION NOT NULL,
    "grid" INTEGER NOT NULL,
    "laps" INTEGER NOT NULL,
    "status" TEXT,
    "time" TEXT,
    "fastestLapTime" TEXT,
    "fastestLapLap" INTEGER,
    "averageSpeed" DOUBLE PRECISION,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("season","round","driverId")
);

-- CreateTable
CREATE TABLE "PitStop" (
    "season" INTEGER NOT NULL,
    "round" INTEGER NOT NULL,
    "driverId" TEXT NOT NULL,
    "stop" INTEGER NOT NULL,
    "lap" INTEGER NOT NULL,
    "duration" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PitStop_pkey" PRIMARY KEY ("season","round","driverId","stop")
);

-- CreateTable
CREATE TABLE "QualifyingResult" (
    "season" INTEGER NOT NULL,
    "round" INTEGER NOT NULL,
    "driverId" TEXT NOT NULL,
    "constructorId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "q1" TEXT,
    "q2" TEXT,
    "q3" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QualifyingResult_pkey" PRIMARY KEY ("season","round","driverId")
);

-- CreateIndex
CREATE INDEX "Circuit_circuitName_idx" ON "Circuit"("circuitName");

-- CreateIndex
CREATE INDEX "Circuit_country_idx" ON "Circuit"("country");

-- CreateIndex
CREATE INDEX "Constructor_name_idx" ON "Constructor"("name");

-- CreateIndex
CREATE INDEX "Constructor_nationality_idx" ON "Constructor"("nationality");

-- CreateIndex
CREATE INDEX "Constructor_year_idx" ON "Constructor"("year");

-- CreateIndex
CREATE UNIQUE INDEX "Constructor_id_year_key" ON "Constructor"("id", "year");

-- CreateIndex
CREATE INDEX "Driver_givenName_familyName_idx" ON "Driver"("givenName", "familyName");

-- CreateIndex
CREATE INDEX "Driver_nationality_idx" ON "Driver"("nationality");

-- CreateIndex
CREATE INDEX "Driver_dateOfBirth_idx" ON "Driver"("dateOfBirth");

-- CreateIndex
CREATE INDEX "Race_circuitId_idx" ON "Race"("circuitId");

-- CreateIndex
CREATE INDEX "Race_raceDate_idx" ON "Race"("raceDate");

-- CreateIndex
CREATE INDEX "Result_position_idx" ON "Result"("position");

-- CreateIndex
CREATE INDEX "Result_points_idx" ON "Result"("points");

-- CreateIndex
CREATE INDEX "Result_driverId_season_round_idx" ON "Result"("driverId", "season", "round");

-- CreateIndex
CREATE INDEX "Result_constructorId_season_round_idx" ON "Result"("constructorId", "season", "round");

-- CreateIndex
CREATE INDEX "PitStop_driverId_season_round_idx" ON "PitStop"("driverId", "season", "round");

-- CreateIndex
CREATE INDEX "PitStop_lap_idx" ON "PitStop"("lap");

-- CreateIndex
CREATE INDEX "QualifyingResult_position_idx" ON "QualifyingResult"("position");

-- CreateIndex
CREATE INDEX "QualifyingResult_driverId_season_round_idx" ON "QualifyingResult"("driverId", "season", "round");

-- CreateIndex
CREATE INDEX "QualifyingResult_constructorId_season_round_idx" ON "QualifyingResult"("constructorId", "season", "round");

-- AddForeignKey
ALTER TABLE "Race" ADD CONSTRAINT "Race_circuitId_fkey" FOREIGN KEY ("circuitId") REFERENCES "Circuit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_constructorId_fkey" FOREIGN KEY ("constructorId") REFERENCES "Constructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_season_round_fkey" FOREIGN KEY ("season", "round") REFERENCES "Race"("season", "round") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PitStop" ADD CONSTRAINT "PitStop_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PitStop" ADD CONSTRAINT "PitStop_season_round_fkey" FOREIGN KEY ("season", "round") REFERENCES "Race"("season", "round") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualifyingResult" ADD CONSTRAINT "QualifyingResult_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Driver"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualifyingResult" ADD CONSTRAINT "QualifyingResult_constructorId_fkey" FOREIGN KEY ("constructorId") REFERENCES "Constructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QualifyingResult" ADD CONSTRAINT "QualifyingResult_season_round_fkey" FOREIGN KEY ("season", "round") REFERENCES "Race"("season", "round") ON DELETE RESTRICT ON UPDATE CASCADE;
