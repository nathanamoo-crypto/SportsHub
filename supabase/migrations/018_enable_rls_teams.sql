-- 018_enable_rls_teams.sql
-- ---------------------------------------------------------------------------
-- Phase 6: teams, players, team_players and competition_teams RLS.
--
-- Visibility model
--   * profiles          : readable for display (manager / name attribution).
--                         No email or credentials live here.
--   * teams             : organizers manage only teams they own; everyone can
--                         read teams actively entered in published competitions.
--   * players           : organizers manage only players they created; everyone
--                         can read players who are squaded in a published team.
--   * team_players      : readable when the team is public (published comp) or
--                         owned by the viewer; writable only by the team's owner.
--   * competition_teams : readable when the competition is published or owned by
--                         the viewer; insertable only by the competition owner.
--
-- No policy subqueries create a cycle (teams -> competition_teams -> competitions;
-- team_players -> teams; players -> team_players). is_organizer() is SECURITY
-- DEFINER (017) so it does not re-enter profile_roles/roles policies.
-- Statements are idempotent (DROP POLICY IF EXISTS).
-- ---------------------------------------------------------------------------

-- profiles ------------------------------------------------------------------
DROP POLICY IF EXISTS "Profiles are readable for display" ON public.profiles;
CREATE POLICY "Profiles are readable for display"
  ON public.profiles
  FOR SELECT
  USING (true);

ALTER TABLE public.teams             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_players      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_teams ENABLE ROW LEVEL SECURITY;

-- teams ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Organizers can view own teams" ON public.teams;
CREATE POLICY "Organizers can view own teams"
  ON public.teams
  FOR SELECT
  USING (public.is_organizer() AND owner_id = auth.uid());

DROP POLICY IF EXISTS "Teams in published competitions are readable by everyone" ON public.teams;

CREATE POLICY "Teams in published competitions are readable by everyone"
ON public.teams
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.competition_teams ct
    JOIN public.competitions c
      ON c.id = ct.competition_id
    WHERE ct.team_id = teams.id
      AND ct.status = 'active'
      AND c.status = 'published'
  )
);

DROP POLICY IF EXISTS "Organizers can create teams" ON public.teams;
CREATE POLICY "Organizers can create teams"
  ON public.teams
  FOR INSERT
  WITH CHECK (public.is_organizer() AND owner_id = auth.uid());

DROP POLICY IF EXISTS "Organizers can update own teams" ON public.teams;
CREATE POLICY "Organizers can update own teams"
  ON public.teams
  FOR UPDATE
  USING (public.is_organizer() AND owner_id = auth.uid())
  WITH CHECK (public.is_organizer() AND owner_id = auth.uid());

DROP POLICY IF EXISTS "Organizers can delete own teams" ON public.teams;
CREATE POLICY "Organizers can delete own teams"
  ON public.teams
  FOR DELETE
  USING (public.is_organizer() AND owner_id = auth.uid());

-- players -------------------------------------------------------------------
DROP POLICY IF EXISTS "Organizers can view own players" ON public.players;
CREATE POLICY "Organizers can view own players"
  ON public.players
  FOR SELECT
  USING (public.is_organizer() AND created_by = auth.uid());

DROP POLICY IF EXISTS "Players in published teams are readable by everyone" ON public.players;
CREATE POLICY "Players in published teams are readable by everyone"
  ON public.players
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.team_players tp
      WHERE tp.player_id = players.id
        AND EXISTS (
          SELECT 1
          FROM public.teams t
          WHERE t.id = tp.team_id
            AND EXISTS (
              SELECT 1
              FROM public.competition_teams ct
              JOIN public.competitions c ON c.id = ct.competition_id
              WHERE ct.team_id = t.id
                AND ct.status = 'active'
                AND c.status = 'published'
            )
        )
    )
  );

DROP POLICY IF EXISTS "Organizers can create players" ON public.players;
CREATE POLICY "Organizers can create players"
  ON public.players
  FOR INSERT
  WITH CHECK (public.is_organizer() AND created_by = auth.uid());

DROP POLICY IF EXISTS "Organizers can update own players" ON public.players;
CREATE POLICY "Organizers can update own players"
  ON public.players
  FOR UPDATE
  USING (public.is_organizer() AND created_by = auth.uid())
  WITH CHECK (public.is_organizer() AND created_by = auth.uid());

DROP POLICY IF EXISTS "Organizers can delete own players" ON public.players;
CREATE POLICY "Organizers can delete own players"
  ON public.players
  FOR DELETE
  USING (public.is_organizer() AND created_by = auth.uid());

-- team_players ---------------------------------------------------------------
DROP POLICY IF EXISTS "Squads of visible teams are readable" ON public.team_players;
CREATE POLICY "Squads of visible teams are readable"
  ON public.team_players
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.teams t
      WHERE t.id = team_id
        AND (
          t.owner_id = auth.uid()
          OR EXISTS (
            SELECT 1
            FROM public.competition_teams ct
            JOIN public.competitions c ON c.id = ct.competition_id
            WHERE ct.team_id = t.id
              AND ct.status = 'active'
              AND c.status = 'published'
          )
        )
    )
  );

DROP POLICY IF EXISTS "Team owners can add players to squads" ON public.team_players;
CREATE POLICY "Team owners can add players to squads"
  ON public.team_players
  FOR INSERT
  WITH CHECK (
    public.is_organizer()
    AND EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_id AND t.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Team owners can update squads" ON public.team_players;
CREATE POLICY "Team owners can update squads"
  ON public.team_players
  FOR UPDATE
  USING (
    public.is_organizer()
    AND EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_id AND t.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_organizer()
    AND EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_id AND t.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Team owners can remove squad members" ON public.team_players;
CREATE POLICY "Team owners can remove squad members"
  ON public.team_players
  FOR DELETE
  USING (
    public.is_organizer()
    AND EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_id AND t.owner_id = auth.uid()
    )
  );

-- competition_teams ----------------------------------------------------------
DROP POLICY IF EXISTS "Competition entries of visible competitions are readable" ON public.competition_teams;
CREATE POLICY "Competition entries of visible competitions are readable"
  ON public.competition_teams
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.competitions c
      WHERE c.id = competition_id
        AND (c.status = 'published' OR c.organizer_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Competition owners can register teams" ON public.competition_teams;
CREATE POLICY "Competition owners can register teams"
  ON public.competition_teams
  FOR INSERT
  WITH CHECK (
    public.is_organizer()
    AND EXISTS (
      SELECT 1 FROM public.competitions c
      WHERE c.id = competition_id AND c.organizer_id = auth.uid()
    )
  );