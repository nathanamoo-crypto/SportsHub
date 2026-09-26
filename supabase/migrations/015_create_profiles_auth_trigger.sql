-- 015_create_profiles_auth_trigger.sql
-- ---------------------------------------------------------------------------
-- Auto-create a profile + default 'player' role whenever a user signs up.
-- Runs server-side on auth.users insert, so registration NEVER depends on
-- the client and users are never asked to choose a role.
--
--   full_name : sourced from raw_user_meta_data 'full_name' (set by client),
--               defaulting to '' so the NOT NULL column is always satisfied.
--   profile_roles : the 'player' role looked up by code (seed 014).
-- SECURITY DEFINER so the inserts bypass RLS; search_path is pinned to keep
-- the definer function safe from search_path hijacking.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  );

  INSERT INTO public.profile_roles (profile_id, role_id)
  SELECT NEW.id, r.id
  FROM public.roles r
  WHERE r.code = 'player';

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();