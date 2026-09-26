-- 023_create_statistics_views.sql
-- ---------------------------------------------------------------------------
-- Phase 9: automatic standings & player statistics.
--
-- Views only. NO standings / player_statistics tables are created: everything
-- aggregates on the fly from matches (authoritative fixtures+results) and
-- match_events.
--
-- Visibility (matches the app's RLS model):
--   * Views are created WITH (security_invoker = true) (PG15+): the underlying
--     table RLS runs against the caller, so drafts stay hidden exactly like
--     queries against the tables. As a belt-and-suspenders every query ALSO
--     filters competitions.status = 'published' and matches.status =
--     'completed' explicitly, so even a PG < 15 downgrade can never leak drafts.
--   * Only completed matches count towards any statistic.
--
-- Definitions
--   * vw_standings     : per competition + team (played/w/d/l/gf/ga/gd/points).
--   * vw_player_stats  : per competition + player (goals/assists/yellow/red).
--                        appearances = DISTINCT completed matches where the
--                        player has >= 1 recorded event (no lineups exist in the
--                        data model, so this is the only provable participation;
--                        e.g. a keeper with a clean sheet and no events is not
--                        counted -- documented limitation).
--   * vw_team_stats    : per team across every published competition (record on
--                        the public team page).
--
-- All statements are idempotent (CREATE OR REPLACE VIEW). No data is inserted.
-- ---------------------------------------------------------------------------

-- vw_standings ---------------------------------------------------------------
CREATE OR REPLACE VIEW public.vw_standings
WITH (security_invoker = true)
AS
WITH completed_matches AS (
  SELECT
    m.id,
    m.competition_id,
    m.home_team_id,
    m.away_team_id,
    m.home_score,
    m.away_score
  FROM public.matches m
  JOIN public.competitions c ON c.id = m.competition_id
  WHERE m.status = 'completed'
    AND c.status = 'published'
),
team_appearances AS (
  SELECT
    competition_id,
    home_team_id AS team_id,
    home_score   AS goals_for,
    away_score   AS goals_against,
    CASE
      WHEN home_score >  away_score THEN 'W'
      WHEN home_score =  away_score THEN 'D'
      ELSE 'L'
    END AS outcome
  FROM completed_matches
  UNION ALL
  SELECT
    competition_id,
    away_team_id AS team_id,
    away_score   AS goals_for,
    home_score   AS goals_against,
    CASE
      WHEN away_score >  home_score THEN 'W'
      WHEN away_score =  home_score THEN 'D'
      ELSE 'L'
    END AS outcome
  FROM completed_matches
)
SELECT
  ta.competition_id,
  ta.team_id,
  t.name AS team_name,
  t.slug AS team_slug,
  COUNT(*)                                                              AS played,
  COUNT(*) FILTER (WHERE ta.outcome = 'W')                              AS wins,
  COUNT(*) FILTER (WHERE ta.outcome = 'D')                              AS draws,
  COUNT(*) FILTER (WHERE ta.outcome = 'L')                              AS losses,
  SUM(ta.goals_for)                                                     AS goals_for,
  SUM(ta.goals_against)                                                 AS goals_against,
  SUM(ta.goals_for) - SUM(ta.goals_against)                             AS goal_difference,
  3 * COUNT(*) FILTER (WHERE ta.outcome = 'W')
    + COUNT(*) FILTER (WHERE ta.outcome = 'D')                          AS points
FROM team_appearances ta
JOIN public.teams t ON t.id = ta.team_id
GROUP BY ta.competition_id, ta.team_id, t.name, t.slug
ORDER BY points DESC, goal_difference DESC, goals_for DESC, t.name ASC;

GRANT SELECT ON public.vw_standings TO anon, authenticated, service_role;

-- vw_player_stats ------------------------------------------------------------
CREATE OR REPLACE VIEW public.vw_player_stats
WITH (security_invoker = true)
AS
SELECT
  m.competition_id,
  p.id           AS player_id,
  p.first_name,
  p.last_name,
  t.id           AS team_id,
  t.name         AS team_name,
  t.slug         AS team_slug,
  COUNT(*)        FILTER (WHERE me.event_type = 'goal')        AS goals,
  COUNT(*)        FILTER (WHERE me.event_type = 'assist')      AS assists,
  COUNT(*)        FILTER (WHERE me.event_type = 'yellow_card') AS yellow_cards,
  COUNT(*)        FILTER (WHERE me.event_type = 'red_card')    AS red_cards,
  COUNT(DISTINCT me.match_id)                                  AS appearances
FROM public.match_events me
JOIN public.matches m      ON m.id = me.match_id
JOIN public.competitions c ON c.id = m.competition_id
JOIN public.players p      ON p.id = me.player_id
JOIN public.teams t        ON t.id = me.team_id
WHERE me.player_id IS NOT NULL
  AND m.status = 'completed'
  AND c.status = 'published'
GROUP BY m.competition_id, p.id, p.first_name, p.last_name, t.id, t.name, t.slug
ORDER BY goals DESC, assists DESC, appearances DESC, p.first_name ASC, p.last_name ASC;

GRANT SELECT ON public.vw_player_stats TO anon, authenticated, service_role;

-- vw_team_stats --------------------------------------------------------------
CREATE OR REPLACE VIEW public.vw_team_stats
WITH (security_invoker = true)
AS
WITH completed_matches AS (
  SELECT
    m.id,
    m.competition_id,
    m.home_team_id,
    m.away_team_id,
    m.home_score,
    m.away_score
  FROM public.matches m
  JOIN public.competitions c ON c.id = m.competition_id
  WHERE m.status = 'completed'
    AND c.status = 'published'
),
team_appearances AS (
  SELECT
    home_team_id AS team_id,
    home_score   AS goals_scored,
    away_score   AS goals_conceded,
    CASE
      WHEN home_score >  away_score THEN 'W'
      WHEN home_score =  away_score THEN 'D'
      ELSE 'L'
    END AS outcome
  FROM completed_matches
  UNION ALL
  SELECT
    away_team_id AS team_id,
    away_score   AS goals_scored,
    home_score   AS goals_conceded,
    CASE
      WHEN away_score >  home_score THEN 'W'
      WHEN away_score =  home_score THEN 'D'
      ELSE 'L'
    END AS outcome
  FROM completed_matches
)
SELECT
  t.id             AS team_id,
  t.name           AS team_name,
  t.slug           AS team_slug,
  COUNT(*)                                                       AS matches_played,
  COUNT(*) FILTER (WHERE ta.outcome = 'W')                       AS wins,
  COUNT(*) FILTER (WHERE ta.outcome = 'D')                       AS draws,
  COUNT(*) FILTER (WHERE ta.outcome = 'L')                       AS losses,
  SUM(ta.goals_scored)                                           AS goals_scored,
  SUM(ta.goals_conceded)                                         AS goals_conceded
FROM team_appearances ta
JOIN public.teams t ON t.id = ta.team_id
GROUP BY t.id, t.name, t.slug
ORDER BY t.name ASC;

GRANT SELECT ON public.vw_team_stats TO anon, authenticated, service_role;