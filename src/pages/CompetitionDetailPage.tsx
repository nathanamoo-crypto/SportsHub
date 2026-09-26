import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { ReactNode } from 'react'
import PageContainer from '../components/PageContainer'
import LoadingSpinner from '../components/LoadingSpinner'
import StatusBadge from '../components/StatusBadge'
import { fetchCompetitionBySlug } from '../services/competitions'
import { fetchCompetitionFixtures } from '../services/fixtures'
import { formatKickoffDate, formatKickoffTime, formatDate } from '../utils/date'
import { stageLabelFor } from '../utils/stages'
import type { Competition, Match } from '../types/domain'

interface CompetitionDetailResult {
  slug: string
  competition: Competition | null
  notFound: boolean
}

export default function CompetitionDetailPage() {
  const { slug: slugParam } = useParams()
  const slug = slugParam ?? ''
  const [result, setResult] = useState<CompetitionDetailResult>({
    slug,
    competition: null,
    notFound: false,
  })
  const [fixtures, setFixtures] = useState<Match[] | null>(null)

  useEffect(() => {
    let active = true
    fetchCompetitionBySlug(slug).then(({ data, error }) => {
      if (!active) return
      if (error || !data) {
        setResult({ slug, competition: null, notFound: true })
        return
      }
      setResult({ slug, competition: data as unknown as Competition, notFound: false })
    })
    return () => {
      active = false
    }
  }, [slug])

  const competition = result.competition

  useEffect(() => {
    if (!competition || competition.status !== 'published') return undefined
    let active = true
    fetchCompetitionFixtures(competition.id).then(({ data, error }) => {
      if (!active) return
      if (error) {
        setFixtures([])
        return
      }
      setFixtures((data ?? []) as unknown as Match[])
    })
    return () => {
      active = false
    }
  }, [competition])

  if (result.slug !== slug) {
    return <LoadingSpinner label="Loading competition..." />
  }

  if (result.notFound) {
    return (
      <PageContainer className="text-center">
        <p className="text-6xl font-extrabold text-brand-600">404</p>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Competition not found</h1>
        <p className="mx-auto mt-2 max-w-md text-slate-600">
          This competition does not exist, is still a draft, or has not been published yet.
        </p>
        <Link
          to="/"
          className="mt-8 inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Back to Home
        </Link>
      </PageContainer>
    )
  }

  if (!competition) {
    return <LoadingSpinner label="Loading competition..." />
  }

  const rows: Array<{ label: string; value: ReactNode }> = [
    { label: 'Sport', value: competition.sports?.name ?? '—' },
    { label: 'Format', value: competition.competition_formats?.name ?? '—' },
    { label: 'Start date', value: formatDate(competition.start_date) },
    { label: 'End date', value: formatDate(competition.end_date) },
    { label: 'Location', value: competition.location ?? '—' },
    { label: 'Status', value: <StatusBadge status={competition.status} /> },
  ]

  const registeredTeams = (competition.competition_teams ?? []).filter(
    (entry) => entry.status === 'active',
  )

  const visibleFixtures =
    competition.status === 'published'
      ? fixtures ?? []
      : []

  return (
    <PageContainer
      title={competition.name}
      description={competition.description || 'No description provided.'}
    >
      <div className="max-w-3xl space-y-8">
        <div className="rounded-2xl border border-slate-200 bg-white">
          <dl className="divide-y divide-slate-100">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between gap-4 px-6 py-4">
                <dt className="text-sm font-medium text-slate-600">{row.label}</dt>
                <dd className="text-sm text-slate-900">{row.value}</dd>
              </div>
            ))}
          </dl>
        </div>

        <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Registered teams</h2>
          {registeredTeams.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-600">
              No teams registered yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {registeredTeams.map((entry) => (
                <li key={entry.id}>
                  <Link
                    to={`/teams/${entry.teams.slug}`}
                    className="block rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-brand-700 hover:bg-slate-50"
                  >
                    {entry.teams.name}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      <section>
          <h2 className="mb-3 text-lg font-semibold text-slate-900">Fixtures</h2>
          {competition.status !== 'published' ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-600">
              Fixtures will be visible once this competition is published.
            </p>
          ) : fixtures === null ? (
            <LoadingSpinner label="Loading fixtures..." />
          ) : visibleFixtures.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-600">
              No fixtures scheduled yet.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Date</th>
                    <th className="px-4 py-3 font-semibold">Time</th>
                    <th className="px-4 py-3 font-semibold">Home</th>
                    <th className="px-4 py-3 font-semibold">Away</th>
                    <th className="px-4 py-3 font-semibold">Venue</th>
                    <th className="px-4 py-3 font-semibold">Stage</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleFixtures.map((fixture) => (
                    <tr key={fixture.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-700">
                        {formatKickoffDate(fixture.start_time)}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {formatKickoffTime(fixture.start_time)}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <Link
                          to={`/matches/${fixture.id}`}
                          className="text-brand-700 hover:underline"
                        >
                          {fixture.home_team?.teams?.name ?? '—'}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        <Link
                          to={`/matches/${fixture.id}`}
                          className="text-brand-700 hover:underline"
                        >
                          {fixture.away_team?.teams?.name ?? '—'}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{fixture.venue?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {fixture.stage_name ?? stageLabelFor(fixture.stage)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={fixture.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </PageContainer>
  )
}