import { supabase, isSupabaseConfigured, notConfiguredResult } from './supabase'

const squadSelect = `
  id,
  position,
  shirt_number,
  joined_at,
  left_at,
  players (id, first_name, last_name, date_of_birth)
`

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

export interface AddPlayerInput {
  teamId: number
  createdBy: string
  firstName: string
  lastName: string
  dateOfBirth: string | null
  position: string
  shirtNumber: number
}

export interface UpdatePlayerInput {
  playerId: number
  membershipId: number
  firstName: string
  lastName: string
  dateOfBirth: string | null
  position: string
  shirtNumber: number
}

export async function fetchSquad(teamId: number | string) {
  if (!isSupabaseConfigured) return notConfiguredResult()
  return supabase
    .from('team_players')
    .select(squadSelect)
    .eq('team_id', teamId)
    .is('left_at', null)
    .order('shirt_number', { ascending: true })
}

export async function addPlayer(input: AddPlayerInput) {
  if (!isSupabaseConfigured) return notConfiguredResult()

  const { data: player, error: playerError } = await supabase
    .from('players')
    .insert({
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      date_of_birth: input.dateOfBirth || null,
      created_by: input.createdBy,
    })
    .select('id')
    .maybeSingle()
  if (playerError) return { data: null, error: playerError }
  if (!player) return { data: null, error: new Error('Player could not be created.') }

  const { data, error } = await supabase
    .from('team_players')
    .insert({
      team_id: input.teamId,
      player_id: player.id,
      position: input.position,
      shirt_number: input.shirtNumber,
    })
    .select(squadSelect)
    .maybeSingle()
  if (error) return { data: null, error }
  return { data, error: null }
}

export async function updatePlayer(input: UpdatePlayerInput) {
  if (!isSupabaseConfigured) return notConfiguredResult()

  const { error: playerError } = await supabase
    .from('players')
    .update({
      first_name: input.firstName.trim(),
      last_name: input.lastName.trim(),
      date_of_birth: input.dateOfBirth || null,
    })
    .eq('id', input.playerId)
  if (playerError) return { data: null, error: playerError }

  const { data, error } = await supabase
    .from('team_players')
    .update({ position: input.position, shirt_number: input.shirtNumber })
    .eq('id', input.membershipId)
    .select(squadSelect)
    .maybeSingle()
  return { data, error }
}

export async function removeMembership(membershipId: number | string) {
  if (!isSupabaseConfigured) return notConfiguredResult()
  return supabase
    .from('team_players')
    .update({ left_at: todayIso() })
    .eq('id', membershipId)
}