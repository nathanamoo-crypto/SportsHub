import type { MatchEvent, MatchEventType } from '../types/domain'

const eventIcons: Record<MatchEventType, string> = {
  goal: '⚽',
  assist: '👟',
  yellow_card: '🟨',
  red_card: '🟥',
}

function playerName(
  player: MatchEvent['player'] | MatchEvent['related_player'],
): string {
  if (!player) return '—'
  const name = `${player.first_name} ${player.last_name}`.trim()
  return name || '—'
}

interface MatchTimelineProps {
  events: MatchEvent[]
  homeTeamId?: number | null
  awayTeamId?: number | null
  emptyText?: string
}

export default function MatchTimeline({
  events,
  homeTeamId,
  awayTeamId,
  emptyText = 'No events recorded yet.',
}: MatchTimelineProps) {
  const sorted = [...events].sort(
    (a, b) => (a.minute ?? 0) - (b.minute ?? 0) || a.id - b.id,
  )

  if (sorted.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-600">
        {emptyText}
      </p>
    )
  }

  const teamSide = (teamId: number): string | null => {
    if (homeTeamId != null && teamId === homeTeamId) return 'Home'
    if (awayTeamId != null && teamId === awayTeamId) return 'Away'
    return null
  }

  return (
    <ol className="space-y-2">
      {sorted.map((event) => {
        const side = teamSide(event.team_id)
        const isAssist = event.event_type === 'assist'
        const name = isAssist
          ? `Assist: ${playerName(event.player)}`
          : playerName(event.player)
        return (
          <li
            key={event.id}
            className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5"
          >
            <span className="w-10 shrink-0 text-right font-mono text-sm font-semibold text-brand-700">
              {event.minute != null ? `${event.minute}'` : '—'}
            </span>
            <span aria-hidden="true" className="text-base leading-none">
              {eventIcons[event.event_type] ?? '•'}
            </span>
            <span className="flex-1 text-sm font-medium text-slate-900">{name}</span>
            {side ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                {side}
              </span>
            ) : null}
            {!isAssist && event.related_player ? (
              <span title={`Related to ${playerName(event.related_player)}`} className="text-xs text-slate-400">
                {playerName(event.related_player)}
              </span>
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}