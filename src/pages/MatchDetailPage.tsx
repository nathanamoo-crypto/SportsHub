import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import LoadingSpinner from '../components/LoadingSpinner'
import StatusBadge from '../components/StatusBadge'
import MatchTimeline from '../components/MatchTimeline'
import { fetchFixtureById } from '../services/fixtures'
import { fetchMatchEvents } from '../services/matchEvents'
import { formatKickoffDate, formatKickoffTime } from '../utils/date'
import { stageLabelFor } from '../utils/stages'
import type { Match, MatchEvent } from '../types/domain'

export default function MatchDetailPage() {
  const { matchId: matchIdParam } = useParams()
  const matchId = matchIdParam ?? ''
  const [match, setMatch] = useState<Match | null>(null)
  const [events, setEvents] = useState<MatchEvent[]>([])
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    let active = true
    fetchFixtureById(matchId).then(({ data, error }) => {
      if (!active) return
      if (error || !data) {
        setNotFound(true)
        return
      }
      setMatch(data as unknown as Match)
    })
    return () => {
      active = false
    }
  }, [matchId])

  useEffect(() => {
    if (!match) return undefined
    let active = true
    fetchMatchEvents(match.id).then(({ data }) => {
      if (!active) return
      setEvents((data ?? []) as unknown as MatchEvent[])
    })
    return () => {
      active = false
    }
  }, [match])

  if (notFound) {
    return (
      <PageContainer className="text-center">
        <p className="text-6xl font-extrabold text-brand-600">404</p>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Match not found</h1>
        <p className="mx-auto mt-2 max-w-md text-slate-600">
          This match does not exist, is not part of a published competition, or has not been
          completed yet.
        </p>
        <Link
          to="/competitions"
          className="mt-8 inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Browse competitions
        </Link>
      </PageContainer>
    )
  }

  if (!match) {
    return <LoadingSpinner label="Loading match..." />
  }

  const homeName = match.home_team?.teams?.name ?? '—'
  const awayName = match.away_team?.teams?.name ?? '—'
  const isCompleted = match.status === 'completed'

  return (
    <PageContainer
      title={`${homeName} vs ${awayName}`}
      description={match.stage_name ?? stageLabelFor(match.stage)}
    >
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="flex w-full flex-col items-center justify-center gap-3 sm:flex-row sm:gap-6">
              <span className="flex-1 text-center text-xl font-bold text-slate-900">
                {homeName}
              </span>
              <span className="text-base font-medium text-slate-400">vs</span>
              <span className="flex-1 text-center text-xl font-bold text-slate-900">
                {awayName}
              </span>
            </div>

            {isCompleted ? (
              <p className="rounded-xl bg-brand-50 px-6 py-3 text-3xl font-black tracking-tight text-brand-700">
                {match.home_score ?? 0} – {match.away_score ?? 0}
              </p>
            ) : (
              <StatusBadge status={match.status} />
            )}
          </div>

          <dl className="mt-6 divide-y divide-slate-100 border-t border-slate-100">
            <div className="flex items-center justify-between gap-4 px-2 py-3">
              <dt className="text-sm font-medium text-slate-600">Date</dt>
              <dd className="text-sm text-slate-900">{formatKickoffDate(match.start_time)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 px-2 py-3">
              <dt className="text-sm font-medium text-slate-600">Kickoff time</dt>
              <dd className="text-sm text-slate-900">{formatKickoffTime(match.start_time)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 px-2 py-3">
              <dt className="text-sm font-medium text-slate-600">Venue</dt>
              <dd className="text-sm text-slate-900">{match.venue?.name ?? '—'}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 px-2 py-3">
              <dt className="text-sm font-medium text-slate-600">Stage</dt>
              <dd className="text-sm text-slate-900">
                {match.stage_name ?? stageLabelFor(match.stage)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 px-2 py-3">
              <dt className="text-sm font-medium text-slate-600">Status</dt>
              <dd className="text-sm text-slate-900">
                <StatusBadge status={match.status} />
              </dd>
            </div>
          </dl>
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Timeline</h2>
            {events.length > 0 ? (
              <span className="text-sm text-slate-500">{events.length} events</span>
            ) : null}
          </div>
          <MatchTimeline
            events={events}
            homeTeamId={match.home_team_id}
            awayTeamId={match.away_team_id}
            emptyText={
              isCompleted ? 'No events recorded.' : 'The timeline will be available once the match is completed.'
            }
          />
        </section>
      </div>
    </PageContainer>
  )
}