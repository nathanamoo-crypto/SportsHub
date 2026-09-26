import { supabase, isSupabaseConfigured } from './supabase'

const squadSelect = `
  id,
  position,
  shirt_number,
  joined_at,
  left_at,
  players (id, first_name, last_name, date_of_birth)
`

function notConfigured() {
  return { data: null, error: new Error('Supabase is not configured.') }
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export async function fetchSquad(teamId) {
  if (!isSupabaseConfigured) return notConfigured()
  return supabase
    .from('team_players')
    .select(squadSelect)
    .eq('team_id', teamId)
    .is('left_at', null)
    .order('shirt_number', { ascending: true })
}

export async function addPlayer({
  teamId,
  createdBy,
  firstName,
  lastName,
  dateOfBirth,
  position,
  shirtNumber,
}) {
  if (!isSupabaseConfigured) return notConfigured()

  const { data: player, error: playerError } = await supabase
    .from('players')
    .insert({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      date_of_birth: dateOfBirth || null,
      created_by: createdBy,
    })
    .select('id')
    .maybeSingle()
  if (playerError) return { data: null, error: playerError }

  const { data, error } = await supabase
    .from('team_players')
    .insert({
      team_id: teamId,
      player_id: player.id,
      position,
      shirt_number: shirtNumber,
    })
    .select(squadSelect)
    .maybeSingle()
  if (error) return { data: null, error }
  return { data, error: null }
}

export async function updatePlayer({
  playerId,
  membershipId,
  firstName,
  lastName,
  dateOfBirth,
  position,
  shirtNumber,
}) {
  if (!isSupabaseConfigured) return notConfigured()

  const { error: playerError } = await supabase
    .from('players')
    .update({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      date_of_birth: dateOfBirth || null,
    })
    .eq('id', playerId)
  if (playerError) return { data: null, error: playerError }

  const { data, error } = await supabase
    .from('team_players')
    .update({ position, shirt_number: shirtNumber })
    .eq('id', membershipId)
    .select(squadSelect)
    .maybeSingle()
  return { data, error }
}

export async function removeMembership(membershipId) {
  if (!isSupabaseConfigured) return notConfigured()
  return supabase
    .from('team_players')
    .update({ left_at: todayIso() })
    .eq('id', membershipId)
}