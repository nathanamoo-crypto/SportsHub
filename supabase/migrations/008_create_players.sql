-- 008_create_players.sql
-- ---------------------------------------------------------------------------
-- players : player IDENTITY, deliberately decoupled from user accounts.
--   profile_id : optional 1:1 link used when a player later claims an account
--                (brief section 7) -- never duplicated.
--   Identity only -- football-specific attributes (position, shirt number)
--   live on the membership record team_players.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.players (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  profile_id    uuid UNIQUE REFERENCES public.profiles (id) ON DELETE SET NULL,
  first_name    text NOT NULL,
  last_name     text NOT NULL,
  date_of_birth date,
  created_by    uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT players_first_name_not_blank CHECK (btrim(first_name) <> ''),
  CONSTRAINT players_last_name_not_blank  CHECK (btrim(last_name) <> '')
);

COMMENT ON TABLE public.players IS
  'Player identity, independent of accounts. Membership in teams is team_players.';

CREATE INDEX IF NOT EXISTS players_created_by_idx
  ON public.players (created_by);

DROP TRIGGER IF EXISTS players_set_updated_at ON public.players;
CREATE TRIGGER players_set_updated_at
  BEFORE UPDATE ON public.players
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();