-- 005_create_competition_formats.sql
-- ---------------------------------------------------------------------------
-- competition_formats : format dictionary that drives the fixture engine.
-- Seeded (idempotently) in 014_seed_reference_data.sql
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.competition_formats (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code       text NOT NULL UNIQUE,
  name       text NOT NULL,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.competition_formats IS
  'Competition format dictionary (league, group_knockout, knockout). Reference data only.';