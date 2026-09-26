import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../context/ToastContext'
import usePageMeta from '../../hooks/usePageMeta'
import PageContainer from '../../components/PageContainer'
import EmptyState from '../../components/EmptyState'
import LoadingSpinner from '../../components/LoadingSpinner'
import StatusBadge from '../../components/StatusBadge'
import ConfirmDialog from '../../components/ConfirmDialog'
import { fetchCompetitionById } from '../../services/competitions'
import { cancelFixture, fetchCompetitionFixtures } from '../../services/fixtures'
import { formatKickoffDate, formatKickoffTime } from '../../utils/date'
import { stageLabelFor } from '../../utils/stages'
import type { Competition, Match } from '../../types/domain'

export default function FixturesPage() {
  const { id: idParam } = useParams()
  const id = idParam ?? ''
  const { user } = useAuth()
  const toast = useToast()
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [fixtures, setFixtures] = useState<Match[] | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [cancellingId, setCancellingId] = useState<number | null>(null)
  const [cancelTarget, setCancelTarget] = useState<Match | null>(null)

  usePageMeta(
    competition ? `Fixtures — ${competition.name} — SportsHub` : 'Fixtures — SportsHub',
  )

  const loadFixtures = useCallback(() => {
    if (!user) return
    fetchCompetitionFixtures(id).then(({ data, error }) => {
      if (error) {
        setFetchError(error.message)
        return
      }
      setFixtures((data ?? []) as unknown as Match[])
    })
  }, [id, user])

  useEffect(() => {
    if (!user) return undefined
    let active = true
    fetchCompetitionById(id).then(({ data, error }) => {
      if (!active) return
      if (error) {
        setFetchError(error.message)
        return
      }
      if (!data) {
        setNotFound(true)
        return
      }
      setCompetition(data as unknown as Competition)
    })
    return () => {
      active = false
    }
  }, [id, user])

  useEffect(() => {
    loadFixtures()
  }, [loadFixtures])

  if (notFound) {
    return (
      <PageContainer className="text-center">
        <p className="text-6xl font-extrabold text-brand-600">404</p>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Competition not found</h1>
        <p className="mx-auto mt-2 max-w-md text-slate-600">
          This competition does not exist or you do not have permission to schedule it.
        </p>
        <Link
          to="/organizer/competitions"
          className="mt-8 inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Back to your competitions
        </Link>
      </PageContainer>
    )
  }

  if (!competition || fixtures === null) {
    return <LoadingSpinner label="Loading fixtures..." />
  }

  const confirmCancel = () => {
    if (!user || !cancelTarget) return
    setCancellingId(cancelTarget.id)
    setFetchError('')
    cancelFixture(cancelTarget.id, competition.id).then(({ error }) => {
      setCancellingId(null)
      setCancelTarget(null)
      if (error) {
        setFetchError(error.message)
        toast.error(error.message)
        return
      }
      toast.success('Fixture cancelled.')
      loadFixtures()
    })
  }

  const headerAction = (
    <Link
      to={`/organizer/competitions/${competition.id}/fixtures/new`}
      className="inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
    >
      Create fixture
    </Link>
  )

  return (
    <PageContainer
      title={`Fixtures — ${competition.name}`}
      description="Schedule matches between teams registered in this competition."
    >
      <div className="mb-4">
        <Link
          to={`/organizer/competitions/${competition.id}/edit`}
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          &larr; Back to competition
        </Link>
      </div>

      {fetchError ? (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {fetchError}
        </p>
      ) : null}

      {fixtures.length === 0 ? (
        <EmptyState
          title="No fixtures yet"
          description="Schedule the first match of this competition. Only registered teams can be selected."
          action={headerAction}
        />
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              {fixtures.length} {fixtures.length === 1 ? 'fixture' : 'fixtures'}
            </p>
            {headerAction}
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Time</th>
                  <th className="px-4 py-3 font-semibold">Home</th>
                  <th className="px-4 py-3 font-semibold">Away</th>
                  <th className="px-4 py-3 font-semibold">Venue</th>
                  <th className="px-4 py-3 font-semibold">Stage</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fixtures.map((fixture) => (
                  <tr key={fixture.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700">
                      {formatKickoffDate(fixture.start_time)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatKickoffTime(fixture.start_time)}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {fixture.home_team?.teams?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900">
                      {fixture.away_team?.teams?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{fixture.venue?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {fixture.stage_name ?? stageLabelFor(fixture.stage)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={fixture.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/matches/${fixture.id}`}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          View
                        </Link>
                        <Link
                          to={`/organizer/fixtures/${fixture.id}/result`}
                          className="rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50"
                        >
                          Result
                        </Link>
                        <Link
                          to={`/organizer/competitions/${competition.id}/fixtures/${fixture.id}/edit`}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Edit
                        </Link>
                        {fixture.status !== 'completed' && fixture.status !== 'cancelled' ? (
                          <button
                            type="button"
                            disabled={cancellingId === fixture.id}
                            onClick={() => setCancelTarget(fixture)}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {cancellingId === fixture.id ? 'Cancelling...' : 'Cancel'}
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

      <ConfirmDialog
        open={cancelTarget !== null}
        title="Cancel this fixture?"
        message={
          cancelTarget
            ? `This permanently cancels ${cancelTarget.home_team?.teams?.name ?? 'Home'} vs ${cancelTarget.away_team?.teams?.name ?? 'Away'}. This cannot be undone.`
            : ''
        }
        confirmLabel="Cancel fixture"
        busy={cancellingId !== null}
        onConfirm={() => void confirmCancel()}
        onCancel={() => setCancelTarget(null)}
      />
    </PageContainer>
  )
}