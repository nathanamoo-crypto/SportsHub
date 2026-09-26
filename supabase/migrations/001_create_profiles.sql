-- 001_create_profiles.sql
-- ---------------------------------------------------------------------------
-- profiles : application-side identity, linked 1:1 to Supabase auth.users.
-- Email and credentials live ONLY in auth.users -- never duplicated here.
-- RLS policies are added in a later migration (Stage 9).
-- ---------------------------------------------------------------------------

-- Shared timestamp trigger used by every table with an updated_at column.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id         uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name  text NOT NULL,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS
  'Public identity and role context for an authenticated account. Credentials stay in auth.users.';

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();