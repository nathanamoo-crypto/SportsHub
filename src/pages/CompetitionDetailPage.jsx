import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import LoadingSpinner from '../components/LoadingSpinner'
import StatusBadge from '../components/StatusBadge'
import { fetchCompetitionBySlug } from '../services/competitions'
import { formatDate } from '../utils/date'

export default function CompetitionDetailPage() {
  const { slug } = useParams()
  const [result, setResult] = useState({ slug, competition: null, notFound: false })

  useEffect(() => {
    let active = true
    fetchCompetitionBySlug(slug).then(({ data, error }) => {
      if (!active) return
      if (error || !data) {
        setResult({ slug, competition: null, notFound: true })
        return
      }
      setResult({ slug, competition: data, notFound: false })
    })
    return () => {
      active = false
    }
  }, [slug])

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

  const competition = result.competition
  if (!competition) {
    return <LoadingSpinner label="Loading competition..." />
  }

  const rows = [
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
      </div>
    </PageContainer>
  )
}