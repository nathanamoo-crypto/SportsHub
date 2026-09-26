-- 016_enable_rls_basic_policies.sql
-- ---------------------------------------------------------------------------
-- Minimum RLS for the authentication phase:
--   1. users can INSERT their own profile
--   2. users can SELECT their own profile
--   3. users can UPDATE their own profile
--   4. public reference dictionaries (roles, sports, competition_formats)
--      are readable by everyone (anon + authenticated)
--   5. users can read their own assigned roles (profile_roles)
--
-- Organizer / team-manager policies come in later phases. Tables not listed
-- here remain undiscoverable by unauthenticated queries until then.
-- Statements are idempotent (DROP POLICY IF EXISTS) for safe re-runs.
-- ---------------------------------------------------------------------------

ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_roles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sports                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_formats    ENABLE ROW LEVEL SECURITY;

-- Public reference dictionaries ---------------------------------------------
DROP POLICY IF EXISTS "Reference data is readable by everyone" ON public.roles;
CREATE POLICY "Reference data is readable by everyone"
  ON public.roles
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Reference data is readable by everyone" ON public.sports;
CREATE POLICY "Reference data is readable by everyone"
  ON public.sports
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Reference data is readable by everyone" ON public.competition_formats;
CREATE POLICY "Reference data is readable by everyone"
  ON public.competition_formats
  FOR SELECT
  USING (true);

-- profiles ------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- profile_roles -------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own roles" ON public.profile_roles;
CREATE POLICY "Users can view own roles"
  ON public.profile_roles
  FOR SELECT
  USING (auth.uid() = profile_id);