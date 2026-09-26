-- 025_fix_team_logo_uploads.sql
-- ---------------------------------------------------------------------------
-- Corrective migration: make team-logo uploads work on projects where the
-- storage policies from 024 were not applied (or were applied to the wrong
-- project).
--
--   * Every statement is idempotent and safe to run repeatedly.
--   * Re-creates ONLY the team-logos storage policies (nothing else changes).
--   * Ends with diagnostic queries so the SQL editor shows what the project
--     actually sees (bucket public flag + which policies exist).
--   * Does NOT relax security: the allow rules are identical to 024
--     (bucket-scoped, authenticated + organizer required, team-owner verified
--     from the object path).
-- ---------------------------------------------------------------------------

-- Re-assert the bucket exists and is public (previous buckets are left intact).
INSERT INTO storage.buckets (id, name, public)
VALUES ('team-logos', 'team-logos', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, public = true;

-- Everyone can read team logos (the bucket is public).
DROP POLICY IF EXISTS "Team logos are publicly readable" ON storage.objects;
CREATE POLICY "Team logos are publicly readable"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'team-logos');

-- Authenticated organizers upload logos for teams they own.
DROP POLICY IF EXISTS "Organizers can upload team logos" ON storage.objects;
CREATE POLICY "Organizers can upload team logos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'team-logos'
    AND auth.role() = 'authenticated'
    AND public.is_organizer()
    AND EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = CAST((storage.foldername(name))[2] AS bigint)
        AND t.owner_id = auth.uid()
    )
  );

-- Organizers replace only their own team's logo (upsert on the stable path).
DROP POLICY IF EXISTS "Organizers can replace their own team logos" ON storage.objects;
CREATE POLICY "Organizers can replace their own team logos"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'team-logos'
    AND auth.role() = 'authenticated'
    AND public.is_organizer()
    AND EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = CAST((storage.foldername(name))[2] AS bigint)
        AND t.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'team-logos'
    AND auth.role() = 'authenticated'
    AND public.is_organizer()
    AND EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = CAST((storage.foldername(name))[2] AS bigint)
        AND t.owner_id = auth.uid()
    )
  );

-- Organizers delete only their own team's logo.
DROP POLICY IF EXISTS "Organizers can delete their own team logos" ON storage.objects;
CREATE POLICY "Organizers can delete their own team logos"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'team-logos'
    AND auth.role() = 'authenticated'
    AND public.is_organizer()
    AND EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = CAST((storage.foldername(name))[2] AS bigint)
        AND t.owner_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Diagnostics (no-op, just for the results pane of the SQL editor).
-- ---------------------------------------------------------------------------

SELECT id, name, public, created_at
FROM storage.buckets
WHERE id = 'team-logos';

SELECT policyname
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE 'Team log%'
ORDER BY policyname;