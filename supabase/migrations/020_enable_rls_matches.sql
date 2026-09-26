-- 020_enable_rls_matches.sql
-- ---------------------------------------------------------------------------
-- Phase 7: fixtures & scheduling RLS.
--
-- Only the competition organizer may create, update, reschedule or cancel
-- fixtures (matches) in their own competition. Public users may read fixtures
-- only when the competition is published; drafts remain hidden.
--
-- Organizer checks reuse public.is_organizer() (SECURITY DEFINER, 017) so the
-- policies do not re-enter profile_roles/roles RLS. All statements are
-- idempotent (DROP POLICY IF EXISTS) for safe re-runs. No data is inserted.
-- ---------------------------------------------------------------------------

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Everyone can read fixtures belonging to published competitions. Organizers
-- can also read fixtures of their own competitions (any status, incl. drafts).
DROP POLICY IF EXISTS "Fixtures of visible competitions are readable" ON public.matches;
CREATE POLICY "Fixtures of visible competitions are readable"
  ON public.matches
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.competitions c
      WHERE c.id = matches.competition_id
        AND (c.status = 'published' OR c.organizer_id = auth.uid())
    )
  );

-- Only the competition organizer can schedule fixtures. The composite FKs on
-- matches -> competition_teams still guarantee both teams are registered.
DROP POLICY IF EXISTS "Competition organizers can schedule fixtures" ON public.matches;
CREATE POLICY "Competition organizers can schedule fixtures"
  ON public.matches
  FOR INSERT
  WITH CHECK (
    public.is_organizer()
    AND EXISTS (
      SELECT 1 FROM public.competitions c
      WHERE c.id = competition_id AND c.organizer_id = auth.uid()
    )
  );

-- Organizer can update (reschedule / cancel / edit) fixtures; the competition
-- cannot be moved to another competition, and organizer_id never changes.
DROP POLICY IF EXISTS "Competition organizers can update fixtures" ON public.matches;
CREATE POLICY "Competition organizers can update fixtures"
  ON public.matches
  FOR UPDATE
  USING (
    public.is_organizer()
    AND EXISTS (
      SELECT 1 FROM public.competitions c
      WHERE c.id = competition_id AND c.organizer_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_organizer()
    AND EXISTS (
      SELECT 1 FROM public.competitions c
      WHERE c.id = competition_id AND c.organizer_id = auth.uid()
    )
  );

-- Organizer can delete fixtures of their own competition.
DROP POLICY IF EXISTS "Competition organizers can delete fixtures" ON public.matches;
CREATE POLICY "Competition organizers can delete fixtures"
  ON public.matches
  FOR DELETE
  USING (
    public.is_organizer()
    AND EXISTS (
      SELECT 1 FROM public.competitions c
      WHERE c.id = competition_id AND c.organizer_id = auth.uid()
    )
  );