import { supabase, isSupabaseConfigured, notConfiguredResult } from './supabase'

const teamSelect = `
  id,
  name,
  slug,
  logo_url,
  is_active,
  owner_id,
  manager_id,
  manager:profiles!teams_manager_id_fkey (id, full_name),
  created_at
`

export interface CreateTeamPayload {
  name: string
  slug: string
  logo_url: string | null
  manager_id: string | null
  is_active: boolean
  owner_id: string
}

export interface UpdateTeamPayload {
  name: string
  logo_url: string | null
  manager_id: string | null
  is_active: boolean
}

export async function fetchOwnedTeams(ownerId: string) {
  if (!isSupabaseConfigured) return notConfiguredResult()
  return supabase
    .from('teams')
    .select(teamSelect)
    .eq('owner_id', ownerId)
    .order('name')
}

export async function fetchTeamById(id: number | string) {
  if (!isSupabaseConfigured) return notConfiguredResult()
  return supabase.from('teams').select(teamSelect).eq('id', id).maybeSingle()
}

export async function fetchTeamBySlug(slug: string) {
  if (!isSupabaseConfigured) return notConfiguredResult()
  return supabase.from('teams').select(teamSelect).eq('slug', slug).maybeSingle()
}

export async function isTeamSlugTaken(slug: string) {
  if (!isSupabaseConfigured) return notConfiguredResult()
  return supabase.from('teams').select('id').eq('slug', slug).maybeSingle()
}

export async function createTeam(payload: CreateTeamPayload) {
  if (!isSupabaseConfigured) return notConfiguredResult()
  return supabase.from('teams').insert(payload).select(teamSelect).maybeSingle()
}

export async function updateTeam(id: number | string, ownerId: string, patch: UpdateTeamPayload) {
  if (!isSupabaseConfigured) return notConfiguredResult()
  return supabase
    .from('teams')
    .update(patch)
    .eq('id', id)
    .eq('owner_id', ownerId)
    .select(teamSelect)
    .maybeSingle()
}

export async function fetchManagerCandidates() {
  if (!isSupabaseConfigured) return notConfiguredResult()
  return supabase.from('profiles').select('id, full_name').order('full_name')
}

export async function fetchTeamRegistrations(competitionId: number | string) {
  if (!isSupabaseConfigured) return notConfiguredResult()
  return supabase
    .from('competition_teams')
    .select('id, status, teams (id, name, slug, is_active)')
    .eq('competition_id', competitionId)
    .order('registered_at')
}

export async function registerTeam(competitionId: number, teamId: number) {
  if (!isSupabaseConfigured) return notConfiguredResult()
  return supabase
    .from('competition_teams')
    .insert({ competition_id: competitionId, team_id: teamId })
    .select()
    .maybeSingle()
}

export async function fetchTeamCompetitions(teamId: number | string) {
  if (!isSupabaseConfigured) return notConfiguredResult()
  return supabase
    .from('competition_teams')
    .select('id, status, competitions (id, name, slug, status)')
    .eq('team_id', teamId)
    .order('registered_at')
}