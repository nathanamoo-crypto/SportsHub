-- 013_create_match_events.sql
-- ---------------------------------------------------------------------------
-- match_events : time-ordered football facts (goal, own_goal, assist,
-- yellow_card, red_card, substitution). Authoritative source from which
-- player statistics are DERIVED -- no duplicated totals are stored.
--
--   player_id            : subjectivity; NULL for team-level bookkeeping.
--   related_player_id    : substitution -> the incoming player.
--   related_match_event_id : 'assist' rows point at their 'goal' event
--                            (self-FK, nullable, cascades with the goal).
--   team_id              : which side the event belongs to (incl. own goals).
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.match_events (
  id                     bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  match_id               bigint NOT NULL REFERENCES public.matches (id) ON DELETE CASCADE,
  team_id                bigint NOT NULL REFERENCES public.teams (id) ON DELETE RESTRICT,
  player_id              bigint REFERENCES public.players (id) ON DELETE SET NULL,
  event_type             text NOT NULL,
  minute                 smallint,
  related_player_id      bigint REFERENCES public.players (id) ON DELETE SET NULL,
  related_match_event_id bigint REFERENCES public.match_events (id) ON DELETE CASCADE,
  created_at             timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT match_events_event_type_check      CHECK (event_type IN ('goal','own_goal','assist','yellow_card','red_card','substitution')),
  CONSTRAINT match_events_minute_range          CHECK (minute IS NULL OR minute BETWEEN 0 AND 120),
  CONSTRAINT match_events_related_not_self      CHECK (related_match_event_id IS NULL OR related_match_event_id <> id)
);

COMMENT ON TABLE public.match_events IS
  'Basic football match events. Source for derived player statistics.';

CREATE INDEX IF NOT EXISTS match_events_match_id_idx
  ON public.match_events (match_id);

CREATE INDEX IF NOT EXISTS match_events_player_id_idx
  ON public.match_events (player_id);

CREATE INDEX IF NOT EXISTS match_events_team_id_idx
  ON public.match_events (team_id);

CREATE INDEX IF NOT EXISTS match_events_related_event_idx
  ON public.match_events (related_match_event_id);