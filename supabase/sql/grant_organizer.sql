-- -----------------------------------------------------------------------------
-- grant_organizer.sql  (TEMPORARY operations helper — NOT part of the app/UI)
-- -----------------------------------------------------------------------------
-- Safely grant the 'organizer' role to one profile during setup/MVP.
--
-- HOW TO USE
--   1. Find the target user's profile id:
--        SELECT id, full_name FROM public.profiles;
--   2. Replace PASTE_PROFILE_UUID_HERE below with that uuid.
--   3. Run this file as postgres (Supabase SQL editor, or psql). A subtlety:
--      profile_roles is RLS-protected, so this must run with owner privileges,
--      never as an anon/authenticated client.
--
-- SAFETY
--   * Refuses to run until the placeholder has been replaced.
--   * Errors if the profile does not exist or roles aren't seeded yet.
--   * Idempotent: ON CONFLICT makes re-runs a no-op. No rows are deleted.
-- -----------------------------------------------------------------------------

DO $$
DECLARE
  v_profile_text text := 'd7bb05b2-cf94-452d-8e44-ece1ed2838ed';
  v_profile_id uuid;
  v_role_id bigint;
BEGIN
  v_profile_id := v_profile_text::uuid;

  IF NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = v_profile_id
  ) THEN
    RAISE EXCEPTION 'No profile found with id %', v_profile_id;
  END IF;

  SELECT id INTO v_role_id
  FROM public.roles
  WHERE code = 'organizer';

  INSERT INTO public.profile_roles (profile_id, role_id)
  VALUES (v_profile_id, v_role_id)
  ON CONFLICT (profile_id, role_id) DO NOTHING;

  RAISE NOTICE 'Organizer role ensured for profile %', v_profile_id;
END $$;