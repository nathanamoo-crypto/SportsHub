import { supabase, isSupabaseConfigured, notConfiguredResult } from './supabase'
import type { MatchStage, MatchStageType } from '../types/domain'

const matchSelect = `
  id,
  competition_id,
  stage_type,
  stage,
  stage_name,
  round_number,
  home_team_id,
  away_team_id,
  venue_id,
  start_time,
  status,
  home_score,
  away_score,
  home_team:competition_teams!matches_home_team_registered (
    teams!competition_teams_team_id_fkey (id, name, slug)
  ),
  away_team:competition_teams!matches_away_team_registered (
    teams!competition_teams_team_id_fkey (id, name, slug)
  ),
  venue:venues (id, name, address, city)
`

export interface CreateFixturePayload {
  competition_id: number
  home_team_id: number
  away_team_id: number
  venue_id: number | null
  start_time: string | null
  stage_type: MatchStageType
  stage: MatchStage
  stage_name: string | null
  round_number: number
}

export interface UpdateFixturePayload {
  home_team_id: number
  away_team_id: number
  venue_id: number | null
  start_time: string | null
  stage_type: MatchStageType
  stage: MatchStage
  stage_name: string | null
  round_number: number
}

export async function fetchCompetitionFixtures(competitionId: number | string) {
  if (!isSupabaseConfigured) return notConfiguredResult()
  return supabase
    .from('matches')
    .select(matchSelect)
    .eq('competition_id', competitionId)
    .order('start_time', { ascending: true, nullsFirst: false })
}

export async function fetchFixtureById(id: number | string) {
  if (!isSupabaseConfigured) return notConfiguredResult()
  return supabase.from('matches').select(matchSelect).eq('id', id).maybeSingle()
}

export async function createFixture(payload: CreateFixturePayload) {
  if (!isSupabaseConfigured) return notConfiguredResult()
  return supabase.from('matches').insert(payload).select(matchSelect).maybeSingle()
}

export async function updateFixture(
  id: number | string,
  competitionId: number | string,
  patch: UpdateFixturePayload,
) {
  if (!isSupabaseConfigured) return notConfiguredResult()
  return supabase
    .from('matches')
    .update(patch)
    .eq('id', id)
    .eq('competition_id', competitionId)
    .select(matchSelect)
    .maybeSingle()
}

export async function cancelFixture(id: number | string, competitionId: number | string) {
  if (!isSupabaseConfigured) return notConfiguredResult()
  return supabase
    .from('matches')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('competition_id', competitionId)
    .select(matchSelect)
    .maybeSingle()
}

export async function saveResult(
  id: number | string,
  competitionId: number | string,
  homeScore: number,
  awayScore: number,
) {
  if (!isSupabaseConfigured) return notConfiguredResult()
  return supabase
    .from('matches')
    .update({
      status: 'completed',
      home_score: homeScore,
      away_score: awayScore,
    })
    .eq('id', id)
    .eq('competition_id', competitionId)
    .select(matchSelect)
    .maybeSingle()
}

export async function fetchVenues() {
  if (!isSupabaseConfigured) return notConfiguredResult()
  return supabase.from('venues').select('id, name, address, city').order('name')
}