import { supabase, isSupabaseConfigured } from './supabase'

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

function notConfigured() {
  return { data: null, error: new Error('Supabase is not configured.') }
}

export async function fetchOwnedTeams(ownerId) {
  if (!isSupabaseConfigured) return notConfigured()
  return supabase
    .from('teams')
    .select(teamSelect)
    .eq('owner_id', ownerId)
    .order('name')
}

export async function fetchTeamById(id) {
  if (!isSupabaseConfigured) return notConfigured()
  return supabase.from('teams').select(teamSelect).eq('id', id).maybeSingle()
}

export async function fetchTeamBySlug(slug) {
  if (!isSupabaseConfigured) return notConfigured()
  return supabase.from('teams').select(teamSelect).eq('slug', slug).maybeSingle()
}

export async function isTeamSlugTaken(slug) {
  if (!isSupabaseConfigured) return notConfigured()
  return supabase.from('teams').select('id').eq('slug', slug).maybeSingle()
}

export async function createTeam(payload) {
  if (!isSupabaseConfigured) return notConfigured()
  return supabase.from('teams').insert(payload).select(teamSelect).maybeSingle()
}

export async function updateTeam(id, ownerId, patch) {
  if (!isSupabaseConfigured) return notConfigured()
  return supabase
    .from('teams')
    .update(patch)
    .eq('id', id)
    .eq('owner_id', ownerId)
    .select(teamSelect)
    .maybeSingle()
}

export async function fetchManagerCandidates() {
  if (!isSupabaseConfigured) return notConfigured()
  return supabase.from('profiles').select('id, full_name').order('full_name')
}

export async function fetchTeamRegistrations(competitionId) {
  if (!isSupabaseConfigured) return notConfigured()
  return supabase
    .from('competition_teams')
    .select('id, status, teams (id, name, slug, is_active)')
    .eq('competition_id', competitionId)
    .order('registered_at')
}

export async function registerTeam(competitionId, teamId) {
  if (!isSupabaseConfigured) return notConfigured()
  return supabase
    .from('competition_teams')
    .insert({ competition_id: competitionId, team_id: teamId })
    .select()
    .maybeSingle()
}

export async function fetchTeamCompetitions(teamId) {
  if (!isSupabaseConfigured) return notConfigured()
  return supabase
    .from('competition_teams')
    .select('id, status, competitions (id, name, slug, status)')
    .eq('team_id', teamId)
    .order('registered_at')
}