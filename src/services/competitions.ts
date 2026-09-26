import { supabase, isSupabaseConfigured, notConfiguredResult } from './supabase'
import type {
  Competition,
  CompetitionFormat,
  CompetitionStatus,
  Sport,
} from '../types/domain'

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

export interface CreateCompetitionPayload {
  name: string
  slug: string
  description: string | null
  sport_id: number
  format_id: number
  location: string | null
  start_date: string | null
  end_date: string | null
  organizer_id: string
}

export interface UpdateCompetitionPayload {
  name: string
  description: string | null
  sport_id: number
  format_id: number
  location: string | null
  start_date: string | null
  end_date: string | null
}

export async function fetchOrgCompetitions(organizerId: string) {
  if (!isSupabaseConfigured) return notConfiguredResult()
  return supabase
    .from('competitions')
    .select(competitionSelect)
    .eq('organizer_id', organizerId)
    .order('created_at', { ascending: false })
}

export interface PublishedCompetitionFilters {
  search?: string
  sportId?: number | string | null
  statuses?: CompetitionStatus[]
}

const publicCompetitionSelect = `
  id,
  name,
  slug,
  description,
  status,
  location,
  start_date,
  end_date,
  sport_id,
  format_id,
  sports (id, name),
  competition_formats (id, code, name)
`

export async function fetchPublishedCompetitions(filters: PublishedCompetitionFilters = {}) {
  if (!isSupabaseConfigured) return notConfiguredResult()
  let builder = supabase.from('competitions').select(publicCompetitionSelect)
  if (filters.search && filters.search.trim()) {
    builder = builder.ilike('name', `%${filters.search.trim()}%`)
  }
  if (filters.sportId) {
    builder = builder.eq('sport_id', filters.sportId)
  }
  if (filters.statuses && filters.statuses.length > 0) {
    builder = builder.in('status', filters.statuses)
  }
  return builder.order('name', { ascending: true })
}

export async function fetchCompetitionById(id: number | string) {
  if (!isSupabaseConfigured) return notConfiguredResult()
  return supabase.from('competitions').select(competitionSelect).eq('id', id).maybeSingle()
}

export async function fetchCompetitionBySlug(slug: string) {
  if (!isSupabaseConfigured) return notConfiguredResult()
  return supabase.from('competitions').select(competitionSelect).eq('slug', slug).maybeSingle()
}

export async function isSlugTaken(slug: string) {
  if (!isSupabaseConfigured) return notConfiguredResult()
  return supabase.from('competitions').select('id').eq('slug', slug).maybeSingle()
}

export async function createCompetition(payload: CreateCompetitionPayload) {
  if (!isSupabaseConfigured) return notConfiguredResult()
  return supabase.from('competitions').insert(payload).select(competitionSelect).maybeSingle()
}

export async function updateCompetition(
  id: number | string,
  organizerId: string,
  patch: UpdateCompetitionPayload,
) {
  if (!isSupabaseConfigured) return notConfiguredResult()
  return supabase
    .from('competitions')
    .update(patch)
    .eq('id', id)
    .eq('organizer_id', organizerId)
    .select(competitionSelect)
    .maybeSingle()
}

export async function deleteCompetition(id: number | string, organizerId: string) {
  if (!isSupabaseConfigured) return notConfiguredResult()
  return supabase
    .from('competitions')
    .delete()
    .eq('id', id)
    .eq('organizer_id', organizerId)
}

export async function publishCompetition(id: number | string, organizerId: string) {
  if (!isSupabaseConfigured) return notConfiguredResult()
  return supabase
    .from('competitions')
    .update({ status: 'published' })
    .eq('id', id)
    .eq('organizer_id', organizerId)
    .select(competitionSelect)
    .maybeSingle()
}

export async function fetchSports() {
  if (!isSupabaseConfigured) return notConfiguredResult()
  return supabase.from('sports').select('id, name').eq('is_active', true).order('name')
}

export async function fetchFormats() {
  if (!isSupabaseConfigured) return notConfiguredResult()
  return supabase
    .from('competition_formats')
    .select('id, code, name')
    .eq('is_active', true)
    .order('name')
}

export type { Competition, CompetitionFormat, Sport }