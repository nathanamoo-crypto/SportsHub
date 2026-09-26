-- 014_seed_reference_data.sql
-- ---------------------------------------------------------------------------
-- Idempotent reference/configuration seeds ONLY.
-- NO competitions, teams, players, fixtures or results are created here.
-- The database ships genuinely empty except for this vocabulary.
-- ---------------------------------------------------------------------------

INSERT INTO public.roles (code, name)
VALUES
  ('admin',         'Platform Admin'),
  ('organizer',     'Organizer'),
  ('team_manager',  'Team Manager'),
  ('player',        'Player')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.sports (name)
VALUES ('Football')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.competition_formats (code, name)
VALUES
  ('league',         'League'),
  ('group_knockout', 'Group -> Knockout'),
  ('knockout',       'Straight Knockout')
ON CONFLICT (code) DO NOTHING;