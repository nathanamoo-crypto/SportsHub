-- 009_create_competitions.sql
-- ---------------------------------------------------------------------------
-- competitions : the core product entity, owned by an organizer profile.
--   slug       : stable public identifier powering /competitions/<slug>.
--   status     : draft -> published -> ongoing -> completed | cancelled.
--   location   : free-text area/city; per-match venues live on matches.venue_id.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.competitions (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name         text NOT NULL,
  slug         text NOT NULL,
  description  text,
  sport_id     bigint NOT NULL REFERENCES public.sports (id) ON DELETE RESTRICT,
  format_id    bigint NOT NULL REFERENCES public.competition_formats (id) ON DELETE RESTRICT,
  organizer_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  status       text NOT NULL DEFAULT 'draft',
  location     text,
  start_date   date,
  end_date     date,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT competitions_slug_key       UNIQUE (slug),
  CONSTRAINT competitions_slug_format    CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  CONSTRAINT competitions_status_check   CHECK (status IN ('draft','published','ongoing','completed','cancelled')),
  CONSTRAINT competitions_dates_check    CHECK (start_date IS NULL OR end_date IS NULL OR start_date <= end_date),
  CONSTRAINT competitions_name_not_blank CHECK (btrim(name) <> '')
);

COMMENT ON TABLE public.competitions IS
  'Competition records owned by an organizer. Teams enter via competition_teams.';

CREATE INDEX IF NOT EXISTS competitions_organizer_id_idx
  ON public.competitions (organizer_id);

CREATE INDEX IF NOT EXISTS competitions_sport_id_idx
  ON public.competitions (sport_id);

CREATE INDEX IF NOT EXISTS competitions_status_idx
  ON public.competitions (status);

DROP TRIGGER IF EXISTS competitions_set_updated_at ON public.competitions;
CREATE TRIGGER competitions_set_updated_at
  BEFORE UPDATE ON public.competitions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();