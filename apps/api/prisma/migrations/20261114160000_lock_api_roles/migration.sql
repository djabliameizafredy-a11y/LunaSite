-- Fermeture de l'API REST Supabase (défense en profondeur, en plus de la RLS de la migration hardening).
-- Le frontend ne parle JAMAIS directement à la base (dossier de conception §14) : seule l'API Express,
-- connectée en postgres (propriétaire), y accède. Les rôles Supabase anon / authenticated n'ont donc besoin d'aucun droit.
-- Blocs conditionnels : ces rôles et cette fonction n'existent pas sur un PostgreSQL local (Docker) -> no-op.

-- Index de la clé étrangère terrain_data -> nasa_datasets (advisor Supabase « unindexed foreign key »)
CREATE INDEX "terrain_data_source_dataset_id_idx" ON "terrain_data"("source_dataset_id");

DO $$
DECLARE r text;
BEGIN
  FOREACH r IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA public FROM %I', r);
      EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM %I', r);
      -- Tables futures créées par postgres : pas de droits par défaut pour ces rôles non plus
      EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM %I', r);
      EXECUTE format('ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM %I', r);
    END IF;
  END LOOP;

  -- public.rls_auto_enable() : fonction Supabase (déclencheur d'événement « ensure_rls » qui active la RLS sur toute
  -- nouvelle table). Elle est SECURITY DEFINER et appelable via /rest/v1/rpc par anon/authenticated (advisor WARN).
  -- On retire ce droit d'appel ; le déclencheur d'événement continue de fonctionner (il n'est pas appelé par ces rôles).
  IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
      REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
      REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;
    END IF;
  END IF;
END $$;
