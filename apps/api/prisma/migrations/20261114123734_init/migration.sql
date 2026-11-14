-- CreateEnum
CREATE TYPE "CalculationLevel" AS ENUM ('mock', 'simplified', 'terrain-aware');

-- CreateEnum
CREATE TYPE "SiteOrigin" AS ENUM ('apollo', 'clps', 'commercial', 'international', 'feature', 'reference');

-- CreateEnum
CREATE TYPE "CoordinatesStatus" AS ENUM ('published', 'approximate_to_verify', 'derived_from_dem');

-- CreateTable
CREATE TABLE "nasa_datasets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "url" TEXT,
    "version" TEXT,
    "sha256" TEXT,
    "imported_at" TIMESTAMP(3) NOT NULL,
    "notes" JSONB,

    CONSTRAINT "nasa_datasets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "landing_sites" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "elevation" DOUBLE PRECISION,
    "terrain_type" TEXT,
    "description" TEXT NOT NULL,
    "origin" "SiteOrigin" NOT NULL,
    "coordinates_status" "CoordinatesStatus" NOT NULL,
    "coordinates_source" TEXT NOT NULL,
    "is_mock" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "landing_sites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "terrain_data" (
    "id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "source_dataset_id" TEXT NOT NULL,
    "elevation" DOUBLE PRECISION,
    "slope" DOUBLE PRECISION,
    "max_slope" DOUBLE PRECISION,
    "local_relief" DOUBLE PRECISION,
    "shadow_risk" DOUBLE PRECISION,
    "horizon_elevation_deg" JSONB,
    "max_horizon_deg" DOUBLE PRECISION,
    "min_range_km" DOUBLE PRECISION,
    "max_range_km" DOUBLE PRECISION,
    "is_mock" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "terrain_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission_windows" (
    "id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "step_minutes" INTEGER NOT NULL,
    "sun_exposure_hours" DOUBLE PRECISION,
    "darkness_hours" DOUBLE PRECISION,
    "calculation_level" "CalculationLevel" NOT NULL,
    "method_version" TEXT NOT NULL,
    "is_mock" BOOLEAN NOT NULL DEFAULT false,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mission_windows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "earth_visibility" (
    "id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "step_minutes" INTEGER NOT NULL,
    "visibility_hours" DOUBLE PRECISION,
    "max_elevation" DOUBLE PRECISION,
    "obstruction_cause" TEXT,
    "calculation_level" "CalculationLevel" NOT NULL,
    "method_version" TEXT NOT NULL,
    "is_mock" BOOLEAN NOT NULL DEFAULT false,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "earth_visibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mission_scores" (
    "id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "step_minutes" INTEGER NOT NULL,
    "solar_score" DOUBLE PRECISION NOT NULL,
    "communication_score" DOUBLE PRECISION NOT NULL,
    "terrain_score" DOUBLE PRECISION,
    "global_score" DOUBLE PRECISION,
    "partial_score" DOUBLE PRECISION NOT NULL,
    "weights" JSONB NOT NULL,
    "terrain_score_version" TEXT,
    "calculation_level" "CalculationLevel" NOT NULL,
    "method_version" TEXT NOT NULL,
    "is_mock" BOOLEAN NOT NULL DEFAULT false,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mission_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_MissionWindowToNasaDataset" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MissionWindowToNasaDataset_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_EarthVisibilityToNasaDataset" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EarthVisibilityToNasaDataset_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_MissionScoreToNasaDataset" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_MissionScoreToNasaDataset_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "landing_sites_region_idx" ON "landing_sites"("region");

-- CreateIndex
CREATE UNIQUE INDEX "terrain_data_site_id_source_dataset_id_key" ON "terrain_data"("site_id", "source_dataset_id");

-- CreateIndex
CREATE UNIQUE INDEX "mission_windows_site_id_start_date_end_date_step_minutes_me_key" ON "mission_windows"("site_id", "start_date", "end_date", "step_minutes", "method_version", "calculation_level");

-- CreateIndex
CREATE UNIQUE INDEX "earth_visibility_site_id_date_end_date_step_minutes_method__key" ON "earth_visibility"("site_id", "date", "end_date", "step_minutes", "method_version", "calculation_level");

-- CreateIndex
CREATE UNIQUE INDEX "mission_scores_site_id_date_end_date_step_minutes_method_ve_key" ON "mission_scores"("site_id", "date", "end_date", "step_minutes", "method_version", "calculation_level");

-- CreateIndex
CREATE INDEX "_MissionWindowToNasaDataset_B_index" ON "_MissionWindowToNasaDataset"("B");

-- CreateIndex
CREATE INDEX "_EarthVisibilityToNasaDataset_B_index" ON "_EarthVisibilityToNasaDataset"("B");

-- CreateIndex
CREATE INDEX "_MissionScoreToNasaDataset_B_index" ON "_MissionScoreToNasaDataset"("B");

-- AddForeignKey
ALTER TABLE "terrain_data" ADD CONSTRAINT "terrain_data_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "landing_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "terrain_data" ADD CONSTRAINT "terrain_data_source_dataset_id_fkey" FOREIGN KEY ("source_dataset_id") REFERENCES "nasa_datasets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_windows" ADD CONSTRAINT "mission_windows_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "landing_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "earth_visibility" ADD CONSTRAINT "earth_visibility_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "landing_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mission_scores" ADD CONSTRAINT "mission_scores_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "landing_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MissionWindowToNasaDataset" ADD CONSTRAINT "_MissionWindowToNasaDataset_A_fkey" FOREIGN KEY ("A") REFERENCES "mission_windows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MissionWindowToNasaDataset" ADD CONSTRAINT "_MissionWindowToNasaDataset_B_fkey" FOREIGN KEY ("B") REFERENCES "nasa_datasets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EarthVisibilityToNasaDataset" ADD CONSTRAINT "_EarthVisibilityToNasaDataset_A_fkey" FOREIGN KEY ("A") REFERENCES "earth_visibility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EarthVisibilityToNasaDataset" ADD CONSTRAINT "_EarthVisibilityToNasaDataset_B_fkey" FOREIGN KEY ("B") REFERENCES "nasa_datasets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MissionScoreToNasaDataset" ADD CONSTRAINT "_MissionScoreToNasaDataset_A_fkey" FOREIGN KEY ("A") REFERENCES "mission_scores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_MissionScoreToNasaDataset" ADD CONSTRAINT "_MissionScoreToNasaDataset_B_fkey" FOREIGN KEY ("B") REFERENCES "nasa_datasets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
