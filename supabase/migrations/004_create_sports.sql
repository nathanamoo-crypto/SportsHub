-- 004_create_sports.sql
-- ---------------------------------------------------------------------------
-- sports : multi-sport dictionary. Only 'Football' is seeded (014).
-- Football-first but multi-sport-ready: the sport-agnostic hierarchy is
-- sport -> competition -> competition_teams -> matches -> match_events.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.sports (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name       text NOT NULL UNIQUE,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.sports IS
  'Sport dictionary. Reference data only -- no competition data here.';