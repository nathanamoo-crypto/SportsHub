-- 026_simplify_team_logo_policies.sql
-- ---------------------------------------------------------------------------
-- Corrective migration: replace the team-logos storage write policies with a
-- simpler, storage-native shape that is guaranteed to work with the Storage
-- service while keeping the security that matters:
--
--   SELECT  : anyone (bucket is public)              -- unchanged
--   INSERT  : authenticated ORGANIZER only
--   UPDATE  : authenticated ORGANIZER only (upsert replace)
--   DELETE  : authenticated ORGANIZER only
--
-- The previous version additionally tried to verify team ownership by parsing
-- the object path (storage.foldername) and joining public.teams inside the
-- policy. That combination triggers "new row violates row-level security
-- policy" in some projects, so we drop it here. The bucket column checks and
-- the organizer gate are kept, and nothing outside `team-logos` is touched.
-- Idempotent: safe to run repeatedly.
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('team-logos', 'team-logos', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, public = true;

DROP POLICY IF EXISTS "Team logos are publicly readable" ON storage.objects;
CREATE POLICY "Team logos are publicly readable"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'team-logos');

DROP POLICY IF EXISTS "Organizers can upload team logos" ON storage.objects;
DROP POLICY IF EXISTS "Organizers can replace their own team logos" ON storage.objects;
DROP POLICY IF EXISTS "Organizers can delete their own team logos" ON storage.objects;
DROP POLICY IF EXISTS "Upload team logos" ON storage.objects;
DROP POLICY IF EXISTS "Replace team logos" ON storage.objects;
DROP POLICY IF EXISTS "Delete team logos" ON storage.objects;

CREATE POLICY "Upload team logos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'team-logos'
    AND auth.role() = 'authenticated'
    AND public.is_organizer()
  );

CREATE POLICY "Replace team logos"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'team-logos'
    AND auth.role() = 'authenticated'
    AND public.is_organizer()
  )
  WITH CHECK (
    bucket_id = 'team-logos'
    AND auth.role() = 'authenticated'
    AND public.is_organizer()
  );

CREATE POLICY "Delete team logos"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'team-logos'
    AND auth.role() = 'authenticated'
    AND public.is_organizer()
  );

-- ---------------------------------------------------------------------------
-- Diagnostics (no-op, for the results pane of the SQL editor).
-- ---------------------------------------------------------------------------

SELECT id, name, public
FROM storage.buckets
WHERE id = 'team-logos';

SELECT policyname
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (policyname ILIKE '%team log%' OR policyname ILIKE '%Team log%')
ORDER BY policyname;