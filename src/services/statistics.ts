import { supabase, isSupabaseConfigured, notConfiguredResult } from './supabase'

export interface StandingRow {
  competition_id: number
  team_id: number
  team_name: string
  team_slug: string
  played: number
  wins: number
  draws: number
  losses: number
  goals_for: number
  goals_against: number
  goal_difference: number
  points: number
}

export interface PlayerStatRow {
  competition_id: number
  player_id: number
  first_name: string
  last_name: string
  team_id: number
  team_name: string
  team_slug: string
  goals: number
  assists: number
  yellow_cards: number
  red_cards: number
  appearances: number
}

export interface TeamStatRow {
  team_id: number
  team_name: string
  team_slug: string
  matches_played: number
  wins: number
  draws: number
  losses: number
  goals_scored: number
  goals_conceded: number
}

export async function fetchStandings(competitionId: number | string) {
  if (!isSupabaseConfigured) return notConfiguredResult()
  return supabase
    .from('vw_standings')
    .select('*')
    .eq('competition_id', competitionId)
    .order('points', { ascending: false })
    .order('goal_difference', { ascending: false })
    .order('goals_for', { ascending: false })
    .order('team_name', { ascending: true })
}

export async function fetchPlayerStats(competitionId: number | string) {
  if (!isSupabaseConfigured) return notConfiguredResult()
  return supabase
    .from('vw_player_stats')
    .select('*')
    .eq('competition_id', competitionId)
    .order('goals', { ascending: false })
    .order('assists', { ascending: false })
    .order('appearances', { ascending: false })
}

export async function fetchTeamStats(teamSlug: string) {
  if (!isSupabaseConfigured) return notConfiguredResult()
  return supabase.from('vw_team_stats').select('*').eq('team_slug', teamSlug).maybeSingle()
}