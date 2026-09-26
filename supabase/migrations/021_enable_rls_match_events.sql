-- 021_enable_rls_match_events.sql
-- ---------------------------------------------------------------------------
-- Phase 8: results & match events RLS.
--
-- Only the competition organizer may modify scores, match status and
-- match_events. Everyone may read events only for COMPLETED matches that
-- belong to published competitions; organizers additionally read events of
-- their own competition's matches (any status, incl. drafts).
--
-- match status/scores live on public.matches, already restricted by 020; this
-- migration only governs public.match_events. Checks reuse public.is_organizer()
-- (SECURITY DEFINER, 017) and join through matches -> competitions, mirroring
-- the 020 policies. Idempotent (DROP POLICY IF EXISTS). No data is inserted.
-- ---------------------------------------------------------------------------

ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;

-- Public: completed matches in published competitions. Organizer: any match in
-- their own competition.
DROP POLICY IF EXISTS "Match events are readable" ON public.match_events;
CREATE POLICY "Match events are readable"
  ON public.match_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.matches m
      JOIN public.competitions c ON c.id = m.competition_id
      WHERE m.id = match_events.match_id
        AND (
          c.organizer_id = auth.uid()
          OR (c.status = 'published' AND m.status = 'completed')
        )
    )
  );

-- Only the competition organizer can add match events.
DROP POLICY IF EXISTS "Competition organizers can add match events" ON public.match_events;
CREATE POLICY "Competition organizers can add match events"
  ON public.match_events
  FOR INSERT
  WITH CHECK (
    public.is_organizer()
    AND EXISTS (
      SELECT 1
      FROM public.matches m
      JOIN public.competitions c ON c.id = m.competition_id
      WHERE m.id = match_id AND c.organizer_id = auth.uid()
    )
  );

-- Only the competition organizer can edit match events; the owning match and
-- competition cannot change.
DROP POLICY IF EXISTS "Competition organizers can update match events" ON public.match_events;
CREATE POLICY "Competition organizers can update match events"
  ON public.match_events
  FOR UPDATE
  USING (
    public.is_organizer()
    AND EXISTS (
      SELECT 1
      FROM public.matches m
      JOIN public.competitions c ON c.id = m.competition_id
      WHERE m.id = match_id AND c.organizer_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_organizer()
    AND EXISTS (
      SELECT 1
      FROM public.matches m
      JOIN public.competitions c ON c.id = m.competition_id
      WHERE m.id = match_id AND c.organizer_id = auth.uid()
    )
  );

-- Only the competition organizer can delete match events.
DROP POLICY IF EXISTS "Competition organizers can delete match events" ON public.match_events;
CREATE POLICY "Competition organizers can delete match events"
  ON public.match_events
  FOR DELETE
  USING (
    public.is_organizer()
    AND EXISTS (
      SELECT 1
      FROM public.matches m
      JOIN public.competitions c ON c.id = m.competition_id
      WHERE m.id = match_id AND c.organizer_id = auth.uid()
    )
  );