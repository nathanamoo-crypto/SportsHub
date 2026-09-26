-- 022_competition_cascade_delete.sql
-- ---------------------------------------------------------------------------
-- Draft cleanup: organizers delete draft competitions that they no longer want.
--
-- Deletion already cascades from competitions -> competition_teams (010),
-- competitions -> matches (012) and matches -> match_events (013). However the
-- composite FKs matches -> competition_teams were created as ON DELETE NO
-- ACTION (default), so when a competition is deleted both a match and its
-- registered competition_teams row are cascade-removed by different paths --
-- the NO ACTION check can fail mid-cascade (23503) depending on processing
-- order. Recreating those two composite FKs with ON DELETE CASCADE makes the
-- whole path deterministic: all descendants of a competition are removed.
--
-- The composite FKs still guarantee (for INSERT/UPDATE, unchanged semantics)
-- that a match may only use teams registered in its competition. Idempotent.
-- No data is inserted.
-- ---------------------------------------------------------------------------

ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_home_team_registered;
ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_away_team_registered;

ALTER TABLE public.matches
  ADD CONSTRAINT matches_home_team_registered
  FOREIGN KEY (competition_id, home_team_id)
  REFERENCES public.competition_teams (competition_id, team_id)
  ON DELETE CASCADE;

ALTER TABLE public.matches
  ADD CONSTRAINT matches_away_team_registered
  FOREIGN KEY (competition_id, away_team_id)
  REFERENCES public.competition_teams (competition_id, team_id)
  ON DELETE CASCADE;