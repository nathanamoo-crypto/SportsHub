import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchStandings } from '../services/statistics'
import type { StandingRow } from '../services/statistics'

interface StandingsTableProps {
  competitionId: number | string
}

export default function StandingsTable({ competitionId }: StandingsTableProps) {
  const [rows, setRows] = useState<StandingRow[] | null>(null)

  useEffect(() => {
    let active = true
    fetchStandings(competitionId).then(({ data, error }) => {
      if (!active) return
      if (error) {
        setRows([])
        return
      }
      setRows((data ?? []) as StandingRow[])
    })
    return () => {
      active = false
    }
  }, [competitionId])

  if (rows === null) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-600">
        Loading standings...
      </p>
    )
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-600">
        No completed matches yet — standings will appear once fixtures are recorded.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
      <table className="w-full min-w-[700px] text-left text-sm">
        <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3 font-semibold">Pos</th>
            <th className="px-4 py-3 font-semibold">Team</th>
            <th className="px-3 py-3 text-center font-semibold">P</th>
            <th className="px-3 py-3 text-center font-semibold">W</th>
            <th className="px-3 py-3 text-center font-semibold">D</th>
            <th className="px-3 py-3 text-center font-semibold">L</th>
            <th className="px-3 py-3 text-center font-semibold">GF</th>
            <th className="px-3 py-3 text-center font-semibold">GA</th>
            <th className="px-3 py-3 text-center font-semibold">GD</th>
            <th className="px-4 py-3 text-right font-semibold">Pts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, index) => (
            <tr key={row.team_id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-semibold text-slate-700">{index + 1}</td>
              <td className="px-4 py-3 font-medium text-slate-900">
                <Link to={`/teams/${row.team_slug}`} className="text-brand-700 hover:underline">
                  {row.team_name}
                </Link>
              </td>
              <td className="px-3 py-3 text-center text-slate-700">{row.played}</td>
              <td className="px-3 py-3 text-center text-slate-700">{row.wins}</td>
              <td className="px-3 py-3 text-center text-slate-700">{row.draws}</td>
              <td className="px-3 py-3 text-center text-slate-700">{row.losses}</td>
              <td className="px-3 py-3 text-center text-slate-700">{row.goals_for}</td>
              <td className="px-3 py-3 text-center text-slate-700">{row.goals_against}</td>
              <td className="px-3 py-3 text-center text-slate-700">{row.goal_difference}</td>
              <td className="px-4 py-3 text-right font-bold text-slate-900">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}