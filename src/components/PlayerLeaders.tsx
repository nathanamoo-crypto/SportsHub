import { useEffect, useState } from 'react'
import { fetchPlayerStats } from '../services/statistics'
import type { PlayerStatRow } from '../services/statistics'

interface PlayerLeadersProps {
  competitionId: number | string
}

interface LeaderEntry {
  rank: number
  name: string
  teamName: string
  value: number
  label: string
}

function leaderboard(
  rows: PlayerStatRow[],
  key: 'goals' | 'assists' | 'yellow_cards',
  label: string,
): LeaderEntry[] {
  return [...rows]
    .sort((a, b) => b[key] - a[key] || a.last_name.localeCompare(b.last_name))
    .slice(0, 10)
    .map((row, index) => ({
      rank: index + 1,
      name: `${row.first_name} ${row.last_name}`.trim(),
      teamName: row.team_name,
      value: row[key],
      label,
    }))
}

function LeaderCard({
  title,
  icon,
  entries,
}: {
  title: string
  icon: string
  entries: LeaderEntry[]
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-4">
        <h3 className="font-semibold text-slate-900">
          <span aria-hidden="true" className="mr-2">
            {icon}
          </span>
          {title}
        </h3>
      </div>
      {entries.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-slate-600">No data yet.</p>
      ) : (
        <ol className="divide-y divide-slate-50">
          {entries.map((entry) => (
            <li
              key={`${entry.label}-${entry.rank}`}
              className="flex items-center gap-3 px-5 py-2.5"
            >
              <span className="w-5 shrink-0 text-center text-xs font-bold text-slate-400">
                {entry.rank}
              </span>
              <span className="flex-1 truncate text-sm text-slate-800">{entry.name}</span>
              <span aria-hidden="true" className="hidden truncate text-xs text-slate-400 sm:block">
                {entry.teamName}
              </span>
              <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700">
                {entry.value} {entry.label}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

export default function PlayerLeaders({ competitionId }: PlayerLeadersProps) {
  const [rows, setRows] = useState<PlayerStatRow[] | null>(null)

  useEffect(() => {
    let active = true
    fetchPlayerStats(competitionId).then(({ data, error }) => {
      if (!active) return
      if (error) {
        setRows([])
        return
      }
      setRows((data ?? []) as PlayerStatRow[])
    })
    return () => {
      active = false
    }
  }, [competitionId])

  if (rows === null) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-600">
        Loading player stats...
      </p>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <LeaderCard title="Top Scorers" icon="⚽" entries={leaderboard(rows, 'goals', 'goals')} />
      <LeaderCard title="Top Assists" icon="👟" entries={leaderboard(rows, 'assists', 'assists')} />
      <LeaderCard
        title="Most Yellow Cards"
        icon="🟨"
        entries={leaderboard(rows, 'yellow_cards', 'cards')}
      />
    </div>
  )
}