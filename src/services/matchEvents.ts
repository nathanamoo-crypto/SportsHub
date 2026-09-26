import { supabase, isSupabaseConfigured, notConfiguredResult } from './supabase'

const matchEventSelect = `
  id,
  match_id,
  team_id,
  event_type,
  minute,
  player_id,
  related_player_id,
  player:players!match_events_player_id_fkey (id, first_name, last_name),
  related_player:players!match_events_related_player_id_fkey (id, first_name, last_name),
  teams (id, name)
`

export interface MatchEventInput {
  match_id: number
  team_id: number
  event_type: string
  minute: number | null
  player_id: number | null
  related_player_id: number | null
}

export async function fetchMatchEvents(matchId: number | string) {
  if (!isSupabaseConfigured) return notConfiguredResult()
  return supabase
    .from('match_events')
    .select(matchEventSelect)
    .eq('match_id', matchId)
    .order('minute', { ascending: true, nullsFirst: false })
    .order('id', { ascending: true })
}

export async function addMatchEvent(input: MatchEventInput) {
  if (!isSupabaseConfigured) return notConfiguredResult()
  return supabase.from('match_events').insert(input).select(matchEventSelect).maybeSingle()
}

export async function updateMatchEvent(
  eventId: number | string,
  patch: Omit<MatchEventInput, 'match_id'>,
) {
  if (!isSupabaseConfigured) return notConfiguredResult()
  return supabase
    .from('match_events')
    .update(patch)
    .eq('id', eventId)
    .select(matchEventSelect)
    .maybeSingle()
}

export async function deleteMatchEvent(eventId: number | string) {
  if (!isSupabaseConfigured) return notConfiguredResult()
  return supabase.from('match_events').delete().eq('id', eventId)
}