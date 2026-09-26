import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import SearchBar from '../components/SearchBar'
import EmptyResults from '../components/EmptyResults'
import NetworkError from '../components/NetworkError'
import Skeleton from '../components/Skeleton'
import { fetchPublicTeams } from '../services/teams'
import { describeError } from '../utils/error'
import usePageMeta from '../hooks/usePageMeta'
import type { PublicTeamEntry } from '../services/teams'

interface TeamWithCompetitions {
  id: number
  team: Exclude<PublicTeamEntry['teams'], null>
  competitions: Array<NonNullable<PublicTeamEntry['competitions']>>
}

function groupTeams(entries: PublicTeamEntry[]): TeamWithCompetitions[] {
  const byId = new Map<number, TeamWithCompetitions>()
  for (const entry of entries) {
    if (!entry.teams) continue
    const existing = byId.get(entry.teams.id)
    if (existing) {
      if (entry.competitions) existing.competitions.push(entry.competitions)
      continue
    }
    byId.set(entry.teams.id, {
      id: entry.teams.id,
      team: entry.teams,
      competitions: entry.competitions ? [entry.competitions] : [],
    })
  }
  return [...byId.values()].sort((a, b) =>
    a.team.name.localeCompare(b.team.name, undefined, { sensitivity: 'base' }),
  )
}

export default function TeamsPage() {
  usePageMeta(
    'Teams — SportsHub',
    'Browse the teams taking part in public SportsHub competitions.',
  )
  const [teams, setTeams] = useState<TeamWithCompetitions[] | null>(null)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    fetchPublicTeams().then(({ data, error: fetchError }) => {
      if (!active) return
      setError(fetchError ? fetchError.message : '')
      setTeams(groupTeams((data ?? []) as unknown as PublicTeamEntry[]))
    })
    return () => {
      active = false
    }
  }, [reloadKey])

  const term = search.trim().toLowerCase()
  const filtered = (teams ?? []).filter((entry) =>
    entry.team.name.toLowerCase().includes(term),
  )

  const retry = () => setReloadKey((key) => key + 1)

  return (
    <PageContainer title="Teams" description="Browse the teams entering our public competitions.">
      <div className="mb-6 w-full sm:max-w-sm">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search teams..."
          label="Search teams"
        />
      </div>

      {error ? (
        <NetworkError message={describeError({ message: error }).message} onRetry={retry} />
      ) : teams === null ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, index) => (
            <Skeleton key={index} className="h-32" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyResults
          title={teams.length === 0 ? 'No teams yet' : 'No teams match your search'}
          description={
            teams.length === 0
              ? 'Teams that enter a published competition will appear here.'
              : 'Try a different search term.'
          }
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((entry) => (
            <li key={entry.id}>
              <Link
                to={`/teams/${entry.team.slug}`}
                className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-brand-200 hover:shadow-sm"
              >
                {entry.team.logo_url ? (
                  <img
                    src={entry.team.logo_url}
                    alt={`${entry.team.name} logo`}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-50 text-lg font-bold text-brand-700">
                    {entry.team.name.charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-slate-900 group-hover:text-brand-700">
                    {entry.team.name}
                  </h3>
                  <p className="mt-0.5 text-sm text-slate-600">
                    Manager: {entry.team.manager?.full_name ?? 'Not assigned'}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {entry.competitions.length}{' '}
                    {entry.competitions.length === 1 ? 'competition' : 'competitions'} entered
                  </p>
                  {entry.competitions.length > 0 ? (
                    <p className="mt-1 truncate text-xs text-slate-400">
                      {entry.competitions.map((competition) => competition.name).join(', ')}
                    </p>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  )
}