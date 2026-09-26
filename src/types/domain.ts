export type CompetitionStatus = 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled'

export interface Sport {
  id: number
  name: string
}

export interface CompetitionFormat {
  id: number
  code: string
  name: string
}

export interface TeamSummary {
  id: number
  name: string
  slug: string
}

export interface CompetitionTeamEntry {
  id: number
  status: 'active' | 'withdrawn'
  teams: TeamSummary
}

export interface Competition {
  id: number
  name: string
  slug: string
  description: string | null
  status: CompetitionStatus
  location: string | null
  start_date: string | null
  end_date: string | null
  organizer_id: string
  sport_id: number
  format_id: number
  sports: Sport | null
  competition_formats: CompetitionFormat | null
  competition_teams: CompetitionTeamEntry[] | null
}

export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface ProfileRef {
  id: string
  full_name: string | null
}

export interface Team extends TeamSummary {
  logo_url: string | null
  is_active: boolean
  owner_id: string
  manager_id: string | null
  manager: ProfileRef | null
  created_at: string
}

export interface Player {
  id: number
  first_name: string
  last_name: string
  date_of_birth: string | null
}

export interface SquadMember {
  id: number
  position: string
  shirt_number: number
  joined_at: string | null
  left_at: string | null
  players: Player
}

export interface CompetitionSummary {
  id: number
  name: string
  slug: string
  status: string
}

export interface TeamCompetitionEntry {
  id: number
  status: 'active' | 'withdrawn'
  competitions: CompetitionSummary
}

export interface ManagerCandidate {
  id: string
  full_name: string | null
}

export type MatchStatus = 'scheduled' | 'completed' | 'postponed' | 'cancelled'
export type MatchStageType = 'league' | 'group' | 'knockout'
export type MatchStage = 'league' | 'group' | 'quarterfinal' | 'semifinal' | 'final'

export interface VenueRef {
  id: number
  name: string
  address: string | null
  city: string | null
}

export interface MatchTeamEmbed {
  teams: TeamSummary | null
}

export interface Match {
  id: number
  competition_id: number
  stage_type: MatchStageType
  stage: MatchStage
  stage_name: string | null
  round_number: number
  home_team_id: number
  away_team_id: number
  venue_id: number | null
  start_time: string | null
  status: MatchStatus
  home_score: number | null
  away_score: number | null
  home_team: MatchTeamEmbed | null
  away_team: MatchTeamEmbed | null
  venue: VenueRef | null
}

export type MatchEventType = 'goal' | 'assist' | 'yellow_card' | 'red_card'

export interface PlayerNameRef {
  id: number
  first_name: string
  last_name: string
}

export interface MatchEvent {
  id: number
  match_id: number
  team_id: number
  event_type: MatchEventType
  minute: number | null
  player_id: number | null
  related_player_id: number | null
  player: PlayerNameRef | null
  related_player: PlayerNameRef | null
  teams: TeamSummary | null
}