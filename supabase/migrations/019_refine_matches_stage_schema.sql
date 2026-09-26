-- 019_refine_matches_stage_schema.sql
-- ---------------------------------------------------------------------------
-- Phase 6.5: refine the matches stage model to support named groups and
-- flexible competition stages before fixtures exist.
--
-- Adds two columns describing the competitive context of a match:
--   stage_type : league | group | knockout   (phase category)
--   stage_name : human-readable stage label (Matchday N, Group A,
--                Quarter Final, Semi Final, Final)
--
-- Existing columns `stage` and `round_number` are KEPT and untouched, and
-- the existing `matches_stage_check` is preserved.
-- No tables are recreated and no competition / team / player / fixture data
-- is inserted; the only UPDATE below backfills values onto existing rows.
-- ---------------------------------------------------------------------------

-- 1. Add columns -------------------------------------------------------------
ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS stage_type text NOT NULL DEFAULT 'league';

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS stage_name text;

-- 2. Backfill existing rows --------------------------------------------------
-- Written generically so it stays correct even if rows already exist:
--   league       -> stage_type='league',   stage_name='Matchday N'
--   group        -> stage_type='group',    stage_name=NULL (filled during fixture
--                                            creation, e.g. 'Group A')
--   quarterfinal -> stage_type='knockout', stage_name='Quarter Final'
--   semifinal    -> stage_type='knockout', stage_name='Semi Final'
--   final        -> stage_type='knockout', stage_name='Final'
UPDATE public.matches
SET stage_type = CASE
      WHEN stage IN ('quarterfinal', 'semifinal', 'final') THEN 'knockout'
      WHEN stage = 'group' THEN 'group'
      ELSE 'league'
    END,
    stage_name = CASE
      WHEN stage = 'league' THEN 'Matchday ' || round_number
      WHEN stage = 'quarterfinal' THEN 'Quarter Final'
      WHEN stage = 'semifinal' THEN 'Semi Final'
      WHEN stage = 'final' THEN 'Final'
      ELSE NULL
    END;

-- 3. Constraints -------------------------------------------------------------

-- stage_type vocabulary
ALTER TABLE public.matches
  DROP CONSTRAINT IF EXISTS matches_stage_type_check;
ALTER TABLE public.matches
  ADD CONSTRAINT matches_stage_type_check
  CHECK (stage_type IN ('league', 'group', 'knockout'));

-- stage_type must always agree with stage:
--   league   -> stage = 'league'
--   group    -> stage = 'group'
--   knockout -> stage IN ('quarterfinal','semifinal','final')
-- The existing matches_stage_check still guarantees stage only holds the five
-- allowed values, so the two CHECK constraints together enforce an exact match.
ALTER TABLE public.matches
  DROP CONSTRAINT IF EXISTS matches_stage_type_stage_consistency_check;
ALTER TABLE public.matches
  ADD CONSTRAINT matches_stage_type_stage_consistency_check
  CHECK (
    (stage_type = 'league'   AND stage = 'league') OR
    (stage_type = 'group'    AND stage = 'group') OR
    (stage_type = 'knockout' AND stage IN ('quarterfinal', 'semifinal', 'final'))
  );

-- Group stages always carry a name (e.g. 'Group A'); league and knockout
-- labels are conventions applied by the backfill / fixture creation logic.
ALTER TABLE public.matches
  DROP CONSTRAINT IF EXISTS matches_group_stages_require_name_check;
ALTER TABLE public.matches
  ADD CONSTRAINT matches_group_stages_require_name_check
  CHECK (stage_type <> 'group' OR stage_name IS NOT NULL);

-- 4. Documentation -----------------------------------------------------------
COMMENT ON COLUMN public.matches.stage_type IS
  'Phase category of the match: league | group | knockout. Must agree with stage.';
COMMENT ON COLUMN public.matches.stage_name IS
  'Stage label. League defaults to "Matchday N", knockout stages to their stage name, and group stages require an explicit value (e.g. "Group A").';

-- ROLLBACK (manual, and only if ever needed):
--   ALTER TABLE public.matches
--     DROP CONSTRAINT IF EXISTS matches_group_stages_require_name_check,
--     DROP CONSTRAINT IF EXISTS matches_stage_type_stage_consistency_check,
--     DROP CONSTRAINT IF EXISTS matches_stage_type_check;
--   ALTER TABLE public.matches DROP COLUMN IF EXISTS stage_name;
--   ALTER TABLE public.matches DROP COLUMN IF EXISTS stage_type;