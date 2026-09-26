-- 017_enable_rls_competitions.sql
-- ---------------------------------------------------------------------------
-- Phase 5: competition RLS.
--   * organizers  : CRUD only competitions where organizer_id = their profile
--   * everyone    : SELECT only published competitions
--   * drafts      : hidden from everyone except the owning organizer
--   * sports / competition_formats : public SELECT (granted in 016).
--
-- is_organizer() is a SECURITY DEFINER helper so policies can check the
-- caller's role without recursively re-entering profile_roles RLS policies.
-- It is granted EXECUTE to anon/authenticated because those roles evaluate
-- the policies that call it; it only ever reports the caller's own flag.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_organizer()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profile_roles pr
    JOIN public.roles r ON r.id = pr.role_id
    WHERE pr.profile_id = auth.uid()
      AND r.code = 'organizer'
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_organizer() TO anon, authenticated, service_role;

ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;

-- Organizers see their own competitions (any status, including drafts).
DROP POLICY IF EXISTS "Organizers can view own competitions" ON public.competitions;
CREATE POLICY "Organizers can view own competitions"
  ON public.competitions
  FOR SELECT
  USING (public.is_organizer() AND auth.uid() = organizer_id);

-- Everyone can see published competitions.
DROP POLICY IF EXISTS "Published competitions are readable by everyone" ON public.competitions;
CREATE POLICY "Published competitions are readable by everyone"
  ON public.competitions
  FOR SELECT
  USING (status = 'published');

-- Organizers create competitions owned by themselves.
DROP POLICY IF EXISTS "Organizers can create competitions" ON public.competitions;
CREATE POLICY "Organizers can create competitions"
  ON public.competitions
  FOR INSERT
  WITH CHECK (public.is_organizer() AND auth.uid() = organizer_id);

-- Organizers update only their own competitions; organizer_id cannot change
-- because WITH CHECK requires the new organizer_id to stay auth.uid().
DROP POLICY IF EXISTS "Organizers can update own competitions" ON public.competitions;
CREATE POLICY "Organizers can update own competitions"
  ON public.competitions
  FOR UPDATE
  USING (public.is_organizer() AND auth.uid() = organizer_id)
  WITH CHECK (public.is_organizer() AND auth.uid() = organizer_id);

-- Organizers delete only their own competitions.
DROP POLICY IF EXISTS "Organizers can delete own competitions" ON public.competitions;
CREATE POLICY "Organizers can delete own competitions"
  ON public.competitions
  FOR DELETE
  USING (public.is_organizer() AND auth.uid() = organizer_id);