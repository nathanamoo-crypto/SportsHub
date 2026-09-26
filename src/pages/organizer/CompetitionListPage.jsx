import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import PageContainer from '../../components/PageContainer'
import EmptyState from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'
import StatusBadge from '../../components/StatusBadge'
import { fetchOrgCompetitions, publishCompetition } from '../../services/competitions'
import { formatDate } from '../../utils/date'

export default function CompetitionListPage() {
  const { user } = useAuth()
  const [competitions, setCompetitions] = useState(null)
  const [fetchError, setFetchError] = useState('')
  const [publishingId, setPublishingId] = useState(null)

  const load = useCallback(() => {
    fetchOrgCompetitions(user.id).then(({ data, error }) => {
      if (error) {
        setFetchError(error.message)
        return
      }
      setCompetitions(data ?? [])
    })
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  const handlePublish = async (id) => {
    setPublishingId(id)
    const { error } = await publishCompetition(id, user.id)
    setPublishingId(null)
    if (error) {
      setFetchError(error.message)
      return
    }
    load()
  }

  const headerAction = (
    <Link
      to="/organizer/competitions/new"
      className="inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
    >
      Create competition
    </Link>
  )

  return (
    <PageContainer
      title="Your competitions"
      description="Competitions you own. Edit, publish or preview them from here."
    >
      {fetchError ? (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {fetchError}
        </p>
      ) : null}

      {competitions === null ? (
        <LoadingSpinner label="Loading competitions..." />
      ) : competitions.length === 0 ? (
        <EmptyState
          title="No competitions yet"
          description="Create your first competition to start organizing."
          action={headerAction}
        />
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              {competitions.length} {competitions.length === 1 ? 'competition' : 'competitions'}
            </p>
            {headerAction}
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Sport</th>
                  <th className="px-4 py-3 font-semibold">Format</th>
                  <th className="px-4 py-3 font-semibold">Start date</th>
                  <th className="px-4 py-3 font-semibold">End date</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {competitions.map((competition) => (
                  <tr key={competition.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        to={`/competitions/${competition.slug}`}
                        className="font-medium text-brand-700 hover:underline"
                      >
                        {competition.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={competition.status} />
                    </td>
                    <td className="px-4 py-3 text-slate-700">{competition.sports?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {competition.competition_formats?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{formatDate(competition.start_date)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatDate(competition.end_date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/organizer/competitions/${competition.id}/edit`}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Edit
                        </Link>
                        {competition.status === 'draft' ? (
                          <button
                            type="button"
                            disabled={publishingId === competition.id}
                            onClick={() => handlePublish(competition.id)}
                            className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {publishingId === competition.id ? 'Publishing...' : 'Publish'}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </PageContainer>
  )
}