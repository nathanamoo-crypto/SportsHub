import { supabase, isSupabaseConfigured } from './supabase'

const competitionSelect = `
  id,
  name,
  slug,
  description,
  status,
  location,
  start_date,
  end_date,
  organizer_id,
  sport_id,
  format_id,
  sports (id, name),
  competition_formats (id, code, name),
  competition_teams (id, status, teams (id, name, slug))
`

function notConfigured() {
  return { data: null, error: new Error('Supabase is not configured.') }
}

export async function fetchOrgCompetitions(organizerId) {
  if (!isSupabaseConfigured) return notConfigured()
  return supabase
    .from('competitions')
    .select(competitionSelect)
    .eq('organizer_id', organizerId)
    .order('created_at', { ascending: false })
}

export async function fetchCompetitionById(id) {
  if (!isSupabaseConfigured) return notConfigured()
  return supabase.from('competitions').select(competitionSelect).eq('id', id).maybeSingle()
}

export async function fetchCompetitionBySlug(slug) {
  if (!isSupabaseConfigured) return notConfigured()
  return supabase.from('competitions').select(competitionSelect).eq('slug', slug).maybeSingle()
}

export async function isSlugTaken(slug) {
  if (!isSupabaseConfigured) return notConfigured()
  return supabase.from('competitions').select('id').eq('slug', slug).maybeSingle()
}

export async function createCompetition(payload) {
  if (!isSupabaseConfigured) return notConfigured()
  return supabase.from('competitions').insert(payload).select(competitionSelect).maybeSingle()
}

export async function updateCompetition(id, organizerId, patch) {
  if (!isSupabaseConfigured) return notConfigured()
  return supabase
    .from('competitions')
    .update(patch)
    .eq('id', id)
    .eq('organizer_id', organizerId)
    .select(competitionSelect)
    .maybeSingle()
}

export async function publishCompetition(id, organizerId) {
  if (!isSupabaseConfigured) return notConfigured()
  return supabase
    .from('competitions')
    .update({ status: 'published' })
    .eq('id', id)
    .eq('organizer_id', organizerId)
    .select(competitionSelect)
    .maybeSingle()
}

export async function fetchSports() {
  if (!isSupabaseConfigured) return notConfigured()
  return supabase.from('sports').select('id, name').eq('is_active', true).order('name')
}

export async function fetchFormats() {
  if (!isSupabaseConfigured) return notConfigured()
  return supabase
    .from('competition_formats')
    .select('id, code, name')
    .eq('is_active', true)
    .order('name')
}