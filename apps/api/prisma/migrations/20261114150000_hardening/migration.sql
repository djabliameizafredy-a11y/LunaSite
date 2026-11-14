-- Renfort du schéma initial (feat/database).
-- 1) Dates en timestamptz UTC (convention docs/DATABASE.md §8) ;
-- 2) contraintes CHECK que Prisma ne sait pas exprimer (bornes, cohérence mock / niveau de calcul) ;
-- 3) RLS activée sur toutes les tables (Supabase expose le schéma public via son API REST :
--    sans RLS, n'importe qui avec la clé anon pourrait lire / écrire). Aucune policy = accès refusé
--    aux rôles anon/authenticated ; l'API se connecte en propriétaire des tables (postgres), non concernée.

-- 1) timestamptz (les valeurs existantes sont interprétées comme UTC)
ALTER TABLE "nasa_datasets"    ALTER COLUMN "imported_at" TYPE TIMESTAMPTZ(3) USING "imported_at" AT TIME ZONE 'UTC';
ALTER TABLE "mission_windows"  ALTER COLUMN "start_date"  TYPE TIMESTAMPTZ(3) USING "start_date"  AT TIME ZONE 'UTC',
                               ALTER COLUMN "end_date"    TYPE TIMESTAMPTZ(3) USING "end_date"    AT TIME ZONE 'UTC',
                               ALTER COLUMN "computed_at" TYPE TIMESTAMPTZ(3) USING "computed_at" AT TIME ZONE 'UTC';
ALTER TABLE "earth_visibility" ALTER COLUMN "date"        TYPE TIMESTAMPTZ(3) USING "date"        AT TIME ZONE 'UTC',
                               ALTER COLUMN "end_date"    TYPE TIMESTAMPTZ(3) USING "end_date"    AT TIME ZONE 'UTC',
                               ALTER COLUMN "computed_at" TYPE TIMESTAMPTZ(3) USING "computed_at" AT TIME ZONE 'UTC';
ALTER TABLE "mission_scores"   ALTER COLUMN "date"        TYPE TIMESTAMPTZ(3) USING "date"        AT TIME ZONE 'UTC',
                               ALTER COLUMN "end_date"    TYPE TIMESTAMPTZ(3) USING "end_date"    AT TIME ZONE 'UTC',
                               ALTER COLUMN "computed_at" TYPE TIMESTAMPTZ(3) USING "computed_at" AT TIME ZONE 'UTC';

-- 2) Contraintes
-- Sites : coordonnées sélénographiques valides, provenance obligatoire (aucun site sans source)
ALTER TABLE "landing_sites" ADD CONSTRAINT "chk_site_lat"    CHECK ("latitude"  BETWEEN -90 AND 90);
ALTER TABLE "landing_sites" ADD CONSTRAINT "chk_site_lon"    CHECK ("longitude" BETWEEN -180 AND 180);
ALTER TABLE "landing_sites" ADD CONSTRAINT "chk_site_name"   CHECK (length(trim("name")) > 0);
ALTER TABLE "landing_sites" ADD CONSTRAINT "chk_site_source" CHECK (length(trim("coordinates_source")) > 0);
ALTER TABLE "landing_sites" ADD CONSTRAINT "chk_site_id"     CHECK ("id" ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

-- Jeux de données : empreinte SHA-256 au bon format si renseignée
ALTER TABLE "nasa_datasets" ADD CONSTRAINT "chk_dataset_sha256" CHECK ("sha256" IS NULL OR "sha256" ~ '^[0-9a-f]{64}$');

-- Terrain : angles et distances physiquement possibles ; profil d'horizon = 360 valeurs (une par degré d'azimut)
ALTER TABLE "terrain_data" ADD CONSTRAINT "chk_terrain_slope"     CHECK ("slope"     IS NULL OR "slope"     BETWEEN 0 AND 90);
ALTER TABLE "terrain_data" ADD CONSTRAINT "chk_terrain_max_slope" CHECK ("max_slope" IS NULL OR "max_slope" BETWEEN 0 AND 90);
ALTER TABLE "terrain_data" ADD CONSTRAINT "chk_terrain_relief"    CHECK ("local_relief" IS NULL OR "local_relief" >= 0);
ALTER TABLE "terrain_data" ADD CONSTRAINT "chk_terrain_max_hor"   CHECK ("max_horizon_deg" IS NULL OR "max_horizon_deg" BETWEEN -90 AND 90);
ALTER TABLE "terrain_data" ADD CONSTRAINT "chk_terrain_ranges"    CHECK (("min_range_km" IS NULL OR "min_range_km" >= 0) AND ("max_range_km" IS NULL OR "max_range_km" >= 0));
ALTER TABLE "terrain_data" ADD CONSTRAINT "chk_terrain_horizon"   CHECK ("horizon_elevation_deg" IS NULL
  OR (jsonb_typeof("horizon_elevation_deg") = 'array' AND jsonb_array_length("horizon_elevation_deg") = 360));

-- Résumés d'ensoleillement : période valide, durées entre 0 et la durée de la période (tolérance = 1 pas)
ALTER TABLE "mission_windows" ADD CONSTRAINT "chk_mw_period" CHECK ("end_date" > "start_date");
ALTER TABLE "mission_windows" ADD CONSTRAINT "chk_mw_step"   CHECK ("step_minutes" > 0);
ALTER TABLE "mission_windows" ADD CONSTRAINT "chk_mw_hours"  CHECK (
  ("sun_exposure_hours" IS NULL OR ("sun_exposure_hours" >= 0
     AND "sun_exposure_hours" <= EXTRACT(EPOCH FROM ("end_date" - "start_date")) / 3600 + "step_minutes" / 60.0))
  AND ("darkness_hours" IS NULL OR ("darkness_hours" >= 0
     AND "darkness_hours" <= EXTRACT(EPOCH FROM ("end_date" - "start_date")) / 3600 + "step_minutes" / 60.0)));
-- Un résultat mock porte le niveau mock, et inversement (un mock ne passe jamais pour un calcul)
ALTER TABLE "mission_windows" ADD CONSTRAINT "chk_mw_mock" CHECK ("is_mock" = ("calculation_level" = 'mock'));

-- Visibilité de la Terre
ALTER TABLE "earth_visibility" ADD CONSTRAINT "chk_ev_period" CHECK ("end_date" > "date");
ALTER TABLE "earth_visibility" ADD CONSTRAINT "chk_ev_step"   CHECK ("step_minutes" > 0);
ALTER TABLE "earth_visibility" ADD CONSTRAINT "chk_ev_hours"  CHECK ("visibility_hours" IS NULL OR ("visibility_hours" >= 0
  AND "visibility_hours" <= EXTRACT(EPOCH FROM ("end_date" - "date")) / 3600 + "step_minutes" / 60.0));
ALTER TABLE "earth_visibility" ADD CONSTRAINT "chk_ev_max_el" CHECK ("max_elevation" IS NULL OR "max_elevation" BETWEEN -90 AND 90);
ALTER TABLE "earth_visibility" ADD CONSTRAINT "chk_ev_mock"   CHECK ("is_mock" = ("calculation_level" = 'mock'));

-- Scores : tous dans [0, 100] ; global / terrain peuvent être NULL (critère manquant), jamais remplacés par 0
ALTER TABLE "mission_scores" ADD CONSTRAINT "chk_ms_period" CHECK ("end_date" > "date");
ALTER TABLE "mission_scores" ADD CONSTRAINT "chk_ms_step"   CHECK ("step_minutes" > 0);
ALTER TABLE "mission_scores" ADD CONSTRAINT "chk_ms_scores" CHECK (
      "solar_score"         BETWEEN 0 AND 100
  AND "communication_score" BETWEEN 0 AND 100
  AND "partial_score"       BETWEEN 0 AND 100
  AND ("terrain_score" IS NULL OR "terrain_score" BETWEEN 0 AND 100)
  AND ("global_score"  IS NULL OR "global_score"  BETWEEN 0 AND 100));
-- Un score global n'existe que si le score terrain existe (sinon critère obligatoire manquant)
ALTER TABLE "mission_scores" ADD CONSTRAINT "chk_ms_global_needs_terrain" CHECK ("global_score" IS NULL OR "terrain_score" IS NOT NULL);
ALTER TABLE "mission_scores" ADD CONSTRAINT "chk_ms_mock"   CHECK ("is_mock" = ("calculation_level" = 'mock'));

-- 3) Row Level Security (Supabase)
ALTER TABLE "nasa_datasets"                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE "landing_sites"                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE "terrain_data"                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "mission_windows"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "earth_visibility"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE "mission_scores"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_MissionWindowToNasaDataset"   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_EarthVisibilityToNasaDataset" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_MissionScoreToNasaDataset"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations"            ENABLE ROW LEVEL SECURITY;
