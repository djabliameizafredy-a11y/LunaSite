-- CreateTable
CREATE TABLE "reference_ephemerides" (
    "id" TEXT NOT NULL,
    "site_id" TEXT NOT NULL,
    "dataset_id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "t_utc" TIMESTAMPTZ(3) NOT NULL,
    "azimuth_deg" DOUBLE PRECISION NOT NULL,
    "elevation_deg" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "reference_ephemerides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reference_ephemerides_dataset_id_idx" ON "reference_ephemerides"("dataset_id");

-- CreateIndex
CREATE UNIQUE INDEX "reference_ephemerides_site_id_dataset_id_body_t_utc_key" ON "reference_ephemerides"("site_id", "dataset_id", "body", "t_utc");

-- AddForeignKey
ALTER TABLE "reference_ephemerides" ADD CONSTRAINT "reference_ephemerides_site_id_fkey" FOREIGN KEY ("site_id") REFERENCES "landing_sites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reference_ephemerides" ADD CONSTRAINT "reference_ephemerides_dataset_id_fkey" FOREIGN KEY ("dataset_id") REFERENCES "nasa_datasets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Contraintes (Prisma ne sait pas les exprimer) : corps autorisés et angles physiquement possibles.
ALTER TABLE "reference_ephemerides" ADD CONSTRAINT "chk_ref_body" CHECK ("body" IN ('sun', 'earth'));
ALTER TABLE "reference_ephemerides" ADD CONSTRAINT "chk_ref_el"   CHECK ("elevation_deg" BETWEEN -90 AND 90);
ALTER TABLE "reference_ephemerides" ADD CONSTRAINT "chk_ref_az"   CHECK ("azimuth_deg" >= 0 AND "azimuth_deg" < 360);

-- Même politique que les autres tables : RLS active, aucun droit pour les rôles de l'API REST Supabase.
ALTER TABLE "reference_ephemerides" ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('REVOKE ALL ON TABLE "reference_ephemerides" FROM %I', r);
    END IF;
  END LOOP;
END $$;
