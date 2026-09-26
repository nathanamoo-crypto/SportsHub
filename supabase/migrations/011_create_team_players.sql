-- 011_create_team_players.sql
-- ---------------------------------------------------------------------------
-- team_players : junction resolving teams <-> players (M:N).
-- Represents MEMBERSHIP: a player may appear for different teams over time.
-- Position / shirt number live here because they are team-specific.
--   UNIQUE(team_id, player_id) WHERE left_at IS NULL allows a player to leave
--   and later rejoin the same team while blocking duplicate active membership.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.team_players (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  team_id      bigint NOT NULL REFERENCES public.teams (id) ON DELETE CASCADE,
  player_id    bigint NOT NULL REFERENCES public.players (id) ON DELETE CASCADE,
  position     text,
  shirt_number smallint,
  joined_at    date NOT NULL DEFAULT CURRENT_DATE,
  left_at      date,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT team_players_position_check      CHECK (position IN ('goalkeeper','defender','midfielder','forward')),
  CONSTRAINT team_players_shirt_number_range  CHECK (shirt_number BETWEEN 1 AND 99),
  CONSTRAINT team_players_dates_check         CHECK (left_at IS NULL OR joined_at <= left_at)
);

COMMENT ON TABLE public.team_players IS
  'Membership of a player in a team (many-to-many), with team-specific attributes.';

CREATE UNIQUE INDEX IF NOT EXISTS team_players_active_membership_key
  ON public.team_players (team_id, player_id)
  WHERE (left_at IS NULL);

CREATE INDEX IF NOT EXISTS team_players_player_id_idx
  ON public.team_players (player_id);