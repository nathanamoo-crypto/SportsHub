-- 024_storage_and_bucket_policies.sql
-- ---------------------------------------------------------------------------
-- Phase 10: Supabase Storage for team logos.
--
--   Bucket : team-logos (existing object storage, NOT a public-schema table --
--   this is the only schema change in the phase and it is Storage-only).
--   Public : everyone may READ (SELECT) any object in the bucket.
--   Write  : only an authenticated ORGANIZER may upload, replace (update) or
--            delete objects, and only objects under teams/<owner's team id>/.
--   Files  : object name pattern "teams/<team_id>/logo" (stable per team) --
--            replace re-uses the same path via upsert, so "replace own logos"
--            is naturally an UPDATE and "delete own logos" a DELETE.
--
-- Ownership is enforced from the object path: the owning team row must have
-- owner_id = auth.uid(). public.is_organizer() is SECURITY DEFINER (017) and is
-- granted EXECUTE to anon/authenticated already. All statements are idempotent.
-- No data is inserted.
-- ---------------------------------------------------------------------------

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