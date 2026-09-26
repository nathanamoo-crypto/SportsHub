-- 010_create_competition_teams.sql
-- ---------------------------------------------------------------------------
-- competition_teams : junction resolving competitions <-> teams (M:N).
-- Represents a team's REGISTRATION in a competition, not general membership.
--   UNIQUE (competition_id, team_id) also backs the composite FK on matches,
--   which guarantees a match only involves teams registered in that competition.
--   status 'withdrawn' lets a team pull out without losing historical rows;
--   hard delete is blocked once matches reference the entry (composite FK).
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.competition_teams (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  competition_id bigint NOT NULL REFERENCES public.competitions (id) ON DELETE CASCADE,
  team_id        bigint NOT NULL REFERENCES public.teams (id) ON DELETE CASCADE,
  status         text NOT NULL DEFAULT 'active',
  registered_at  timestamptz NOT NULL DEFAULT now(),
  created_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT competition_teams_competition_id_team_id_key UNIQUE (competition_id, team_id),
  CONSTRAINT competition_teams_status_check CHECK (status IN ('active','withdrawn'))
);

COMMENT ON TABLE public.competition_teams IS
  'Registration of a team in a competition (many-to-many).';

CREATE INDEX IF NOT EXISTS competition_teams_team_id_idx
  ON public.competition_teams (team_id);