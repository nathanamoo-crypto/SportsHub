-- 007_create_teams.sql
-- ---------------------------------------------------------------------------
-- teams : teams are GLOBAL records (a club can enter many competitions).
--   owner_id   : administrative owner of the team record (FK -> profiles).
--   manager_id : the coach/day-to-day manager (nullable, may equal owner).
--   slug       : stable public identifier powering /teams/<slug>.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.teams (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name       text NOT NULL,
  slug       text NOT NULL,
  owner_id   uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  manager_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  logo_url   text,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT teams_slug_key        UNIQUE (slug),
  CONSTRAINT teams_slug_format     CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT teams_name_not_blank  CHECK (btrim(name) <> '')
);

COMMENT ON TABLE public.teams IS
  'Global team records. Participation in a specific competition is competition_teams.';

CREATE INDEX IF NOT EXISTS teams_owner_id_idx
  ON public.teams (owner_id);

CREATE INDEX IF NOT EXISTS teams_manager_id_idx
  ON public.teams (manager_id);

DROP TRIGGER IF EXISTS teams_set_updated_at ON public.teams;
CREATE TRIGGER teams_set_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();