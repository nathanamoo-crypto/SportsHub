-- 003_create_profile_roles.sql
-- ---------------------------------------------------------------------------
-- profile_roles : junction resolving users <-> roles (many-to-many).
-- A profile may hold several roles (e.g. Organizer + Team Manager).
-- Default 'player' role is assigned at account creation during auth work (Stage 2).
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.profile_roles (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  role_id    bigint NOT NULL REFERENCES public.roles (id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profile_roles_profile_id_role_id_key UNIQUE (profile_id, role_id)
);

COMMENT ON TABLE public.profile_roles IS
  'Which roles are assigned to which profiles. One row per (profile, role).';

CREATE INDEX IF NOT EXISTS profile_roles_role_id_idx
  ON public.profile_roles (role_id);