import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import SearchBar from '../components/SearchBar'
import FilterDropdown from '../components/FilterDropdown'
import EmptyResults from '../components/EmptyResults'
import NetworkError from '../components/NetworkError'
import Skeleton from '../components/Skeleton'
import StatusBadge from '../components/StatusBadge'
import { fetchPublishedCompetitions, fetchSports } from '../services/competitions'
import { describeError } from '../utils/error'
import { formatDate } from '../utils/date'
import usePageMeta from '../hooks/usePageMeta'
import type { Competition, CompetitionStatus, Sport } from '../types/domain'
import type { FilterOption } from '../components/FilterDropdown'

const STATUS_OPTIONS: FilterOption[] = [
  { value: '', label: 'All statuses' },
  { value: 'published', label: 'Published' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
]

const STATUS_GROUPS: Record<string, CompetitionStatus[]> = {
  '': ['published', 'ongoing', 'completed'],
  published: ['published'],
  ongoing: ['ongoing'],
  completed: ['completed'],
}

function dateRange(start: string | null, end: string | null): string {
  const startLabel = formatDate(start)
  const endLabel = formatDate(end)
  if (startLabel === '—' && endLabel === '—') return '—'
  if (startLabel === endLabel) return startLabel
  return `${startLabel} – ${endLabel === '—' ? 'Open' : endLabel}`
}

export default function CompetitionsPage() {
  usePageMeta(
    'Competitions — SportsHub',
    'Browse all public competitions running on SportsHub.',
  )
  const [competitions, setCompetitions] = useState<Competition[] | null>(null)
  const [sports, setSports] = useState<Sport[]>([])
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sportFilter, setSportFilter] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true
    fetchPublishedCompetitions({
      search,
      sportId: sportFilter || null,
      statuses: STATUS_GROUPS[statusFilter] ?? STATUS_GROUPS[''],
    }).then(({ data, error: fetchError }) => {
      if (!active) return
      setError(fetchError ? fetchError.message : '')
      setCompetitions((data ?? []) as unknown as Competition[])
    })
    return () => {
      active = false
    }
  }, [search, statusFilter, sportFilter, reloadKey])

  useEffect(() => {
    let active = true
    fetchSports().then(({ data }) => {
      if (!active) return
      setSports((data ?? []) as Sport[])
    })
    return () => {
      active = false
    }
  }, [])

  const sportOptions: FilterOption[] = [
    { value: '', label: 'All sports' },
    ...sports.map((sport) => ({ value: String(sport.id), label: sport.name })),
  ]

  const retry = () => setReloadKey((key) => key + 1)

  return (
    <PageContainer
      title="Competitions"
      description="Browse public competitions running on SportsHub."
    >
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-sm">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search competitions..."
            label="Search competitions"
          />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <FilterDropdown
            label="Filter by sport"
            value={sportFilter}
            options={sportOptions}
            onChange={setSportFilter}
          />
          <FilterDropdown
            label="Filter by status"
            value={statusFilter}
            options={STATUS_OPTIONS}
            onChange={setStatusFilter}
          />
        </div>
      </div>

      {error ? (
        <NetworkError
          message={describeError({ message: error }).message}
          onRetry={retry}
        />
      ) : competitions === null ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-44" />
          ))}
        </div>
      ) : competitions.length === 0 ? (
        <EmptyResults
          title="No competitions match your search"
          description="Try a different search term or clear the filters."
        />
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {competitions.map((competition) => (
            <li key={competition.id}>
              <Link
                to={`/competitions/${competition.slug}`}
                className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-brand-200 hover:shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-semibold text-slate-900 group-hover:text-brand-700">
                    {competition.name}
                  </h3>
                  <StatusBadge status={competition.status} />
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  {competition.sports?.name ?? 'Sport'} ·{' '}
                  {competition.competition_formats?.name ?? 'Format'}
                </p>
                <dl className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-sm text-slate-600">
                  <div>
                    <span className="font-medium text-slate-500">Dates: </span>
                    {dateRange(competition.start_date, competition.end_date)}
                  </div>
                  <div>
                    <span className="font-medium text-slate-500">Location: </span>
                    {competition.location ?? '—'}
                  </div>
                </dl>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageContainer>
  )
}