-- 012_create_matches.sql
-- ---------------------------------------------------------------------------
-- matches : the single authoritative source for fixtures AND results.
-- Standings and all statistics MUST be derived from this table (no stored
-- standings / player_statistics tables).
--
--   stage         : league | group | quarterfinal | semifinal | final
--   round_number  : league -> matchday ; group -> round within group ;
--                   knockout -> leg (1 or 2) for two-legged ties.
--   home/away     : composite FKs -> competition_teams(competition_id, team_id)
--                   guarantee both teams are REGISTERED in the competition.
--   scores        : only meaningful when status = 'completed' (enforced).
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.matches (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  competition_id bigint NOT NULL REFERENCES public.competitions (id) ON DELETE CASCADE,
  stage          text NOT NULL DEFAULT 'league',
  round_number   smallint NOT NULL DEFAULT 1,
  home_team_id   bigint NOT NULL,
  away_team_id   bigint NOT NULL,
  venue_id       bigint REFERENCES public.venues (id) ON DELETE SET NULL,
  start_time     timestamptz,
  status         text NOT NULL DEFAULT 'scheduled',
  home_score     smallint,
  away_score     smallint,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT matches_stage_check     CHECK (stage IN ('league','group','quarterfinal','semifinal','final')),
  CONSTRAINT matches_round_number_check CHECK (round_number >= 1),
  CONSTRAINT matches_status_check    CHECK (status IN ('scheduled','completed','postponed','cancelled')),
  CONSTRAINT matches_scores_require_completed
    CHECK ((status = 'completed') = (home_score IS NOT NULL AND away_score IS NOT NULL)),
  CONSTRAINT matches_home_score_non_negative CHECK (home_score IS NULL OR home_score >= 0),
  CONSTRAINT matches_away_score_non_negative CHECK (away_score IS NULL OR away_score >= 0),
  CONSTRAINT matches_home_away_distinct CHECK (home_team_id <> away_team_id),
  CONSTRAINT matches_home_team_registered
    FOREIGN KEY (competition_id, home_team_id)
    REFERENCES public.competition_teams (competition_id, team_id),
  CONSTRAINT matches_away_team_registered
    FOREIGN KEY (competition_id, away_team_id)
    REFERENCES public.competition_teams (competition_id, team_id)
);

COMMENT ON TABLE public.matches IS
  'Fixtures and results. Authoritative source for derived standings and statistics.';

CREATE UNIQUE INDEX IF NOT EXISTS matches_unique_fixture_key
  ON public.matches (competition_id, home_team_id, away_team_id, start_time);

CREATE INDEX IF NOT EXISTS matches_competition_status_idx
  ON public.matches (competition_id, status);

CREATE INDEX IF NOT EXISTS matches_venue_id_idx
  ON public.matches (venue_id);

CREATE INDEX IF NOT EXISTS matches_home_team_id_idx
  ON public.matches (home_team_id);

CREATE INDEX IF NOT EXISTS matches_away_team_id_idx
  ON public.matches (away_team_id);

CREATE INDEX IF NOT EXISTS matches_start_time_idx
  ON public.matches (start_time);

DROP TRIGGER IF EXISTS matches_set_updated_at ON public.matches;
CREATE TRIGGER matches_set_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();