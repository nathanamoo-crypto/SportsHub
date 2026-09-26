-- 006_create_venues.sql
-- ---------------------------------------------------------------------------
-- venues : reusable match locations. A venue hosts many matches (and can be
-- used across competitions).
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.venues (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name       text NOT NULL,
  address    text,
  city       text,
  created_by uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.venues IS
  'Reusable match grounds. Created by a profile; referenced by matches.';

CREATE INDEX IF NOT EXISTS venues_created_by_idx
  ON public.venues (created_by);

DROP TRIGGER IF EXISTS venues_set_updated_at ON public.venues;
CREATE TRIGGER venues_set_updated_at
  BEFORE UPDATE ON public.venues
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();