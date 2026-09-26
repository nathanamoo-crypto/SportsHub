-- 002_create_roles.sql
-- ---------------------------------------------------------------------------
-- roles : role vocabulary so a user can hold MULTIPLE roles.
-- Seeded (idempotently) in 014_seed_reference_data.sql
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.roles (
  id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code       text NOT NULL UNIQUE,
  name       text NOT NULL,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.roles IS
  'Role vocabulary (admin, organizer, team_manager, player). Assigned to users via profile_roles.';