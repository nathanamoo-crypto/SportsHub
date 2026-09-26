import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useToast } from '../../context/ToastContext'
import usePageMeta from '../../hooks/usePageMeta'
import PageContainer from '../../components/PageContainer'
import LoadingSpinner from '../../components/LoadingSpinner'
import StatusBadge from '../../components/StatusBadge'
import ConfirmDialog from '../../components/ConfirmDialog'
import MatchTimeline from '../../components/MatchTimeline'
import { fetchFixtureById, saveResult } from '../../services/fixtures'
import {
  addMatchEvent,
  deleteMatchEvent,
  fetchMatchEvents,
  updateMatchEvent,
} from '../../services/matchEvents'
import { fetchSquad } from '../../services/squads'
import { formatKickoffDate, formatKickoffTime } from '../../utils/date'
import { stageLabelFor } from '../../utils/stages'
import type {
  Match,
  MatchEvent,
  MatchEventType,
  SquadMember,
} from '../../types/domain'

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'

const EVENT_TYPES: Array<{ value: MatchEventType; label: string }> = [
  { value: 'goal', label: '⚽ Goal' },
  { value: 'assist', label: '👟 Assist' },
  { value: 'yellow_card', label: '🟨 Yellow Card' },
  { value: 'red_card', label: '🟥 Red Card' },
]

interface ScoreFormValues {
  home_score: number
  away_score: number
}

interface EventFormValues {
  event_type: MatchEventType | ''
  team_id: string
  player_id: string
  related_player_id: string
  minute: string
}

const emptyEventForm: EventFormValues = {
  event_type: '',
  team_id: '',
  player_id: '',
  related_player_id: '',
  minute: '',
}

function fullName(player: { first_name: string; last_name: string } | null | undefined): string {
  if (!player) return '—'
  const name = `${player.first_name} ${player.last_name}`.trim()
  return name || '—'
}

export default function FixtureResultPage() {
  const { fixtureId: fixtureIdParam } = useParams()
  const fixtureId = fixtureIdParam ?? ''
  const toast = useToast()
  const [fixture, setFixture] = useState<Match | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [events, setEvents] = useState<MatchEvent[]>([])
  const [squads, setSquads] = useState<Record<string, SquadMember[]>>({})
  const [scoreSaved, setScoreSaved] = useState(false)
  const [scoreSaving, setScoreSaving] = useState(false)
  const [eventForm, setEventForm] = useState<EventFormValues>(emptyEventForm)
  const [editingEventId, setEditingEventId] = useState<number | null>(null)
  const [eventError, setEventError] = useState('')
  const [eventSaving, setEventSaving] = useState(false)
  const [removingEventId, setRemovingEventId] = useState<number | null>(null)
  const [removeTarget, setRemoveTarget] = useState<number | null>(null)

  usePageMeta(
    fixture
      ? `Result — ${fixture.home_team?.teams?.name ?? 'Home'} vs ${fixture.away_team?.teams?.name ?? 'Away'} — SportsHub`
      : 'Fixture result — SportsHub',
  )
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ScoreFormValues>()

  const loadEvents = useCallback(() => {
    fetchMatchEvents(fixtureId).then(({ data, error }) => {
      if (error) {
        setFetchError(error.message)
        return
      }
      setEvents((data ?? []) as unknown as MatchEvent[])
    })
  }, [fixtureId])

  useEffect(() => {
    let active = true
    fetchFixtureById(fixtureId).then(({ data, error }) => {
      if (!active) return
      if (error) {
        setFetchError(error.message)
        return
      }
      if (!data) {
        setNotFound(true)
        return
      }
      setFixture(data as unknown as Match)
    })
    return () => {
      active = false
    }
  }, [fixtureId])

  useEffect(() => {
    if (!fixture) return
    reset({
      home_score: fixture.home_score ?? 0,
      away_score: fixture.away_score ?? 0,
    })
    const teamIds = [Number(fixture.home_team_id), Number(fixture.away_team_id)]
    Promise.all(teamIds.map((teamId) => fetchSquad(teamId))).then((results) => {
      const next: Record<string, SquadMember[]> = {}
      results.forEach(({ data, error }, index) => {
        if (!error) next[teamIds[index]] = (data ?? []) as unknown as SquadMember[]
      })
      setSquads(next)
    })
  }, [fixture, reset])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  if (notFound) {
    return (
      <PageContainer className="text-center">
        <p className="text-6xl font-extrabold text-brand-600">404</p>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Fixture not found</h1>
        <p className="mx-auto mt-2 max-w-md text-slate-600">
          This fixture does not exist or you do not have permission to record its result.
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

  if (!fixture) {
    return <LoadingSpinner label="Loading fixture..." />
  }

  const homeName = fixture.home_team?.teams?.name ?? '—'
  const awayName = fixture.away_team?.teams?.name ?? '—'

  const onSaveScore = async ({ home_score, away_score }: ScoreFormValues) => {
    setScoreSaved(false)
    setScoreSaving(true)
    setFetchError('')
    const { data, error } = await saveResult(
      fixture.id,
      fixture.competition_id,
      Number(home_score),
      Number(away_score),
    )
    setScoreSaving(false)
    if (error) {
      setFetchError(error.message)
      toast.error(error.message)
      return
    }
    setScoreSaved(true)
    toast.success('Result saved.')
    if (data) setFixture(data as unknown as Match)
  }

  const teamIdSelected = eventForm.team_id
  const squadPlayers = teamIdSelected ? (squads[teamIdSelected] ?? []) : []

  const playerOptions = squadPlayers.map((member) => ({
    value: member.players.id,
    label: fullName(member.players),
  }))

  const relatedPlayerOptions =
    eventForm.event_type === 'assist' && eventForm.player_id
      ? playerOptions.filter((option) => option.value !== Number(eventForm.player_id))
      : []

  const setFormField = (field: keyof EventFormValues, value: string) => {
    setEventForm((current) => ({ ...current, [field]: value }))
    if (field === 'team_id' || field === 'event_type') {
      setEventForm((current) => ({
        ...current,
        [field]: value,
        player_id: '',
        related_player_id: '',
      }))
    }
  }

  const startEditing = (event: MatchEvent) => {
    setEditingEventId(event.id)
    setEventError('')
    setEventForm({
      event_type: event.event_type,
      team_id: String(event.team_id),
      player_id: event.player_id != null ? String(event.player_id) : '',
      related_player_id:
        event.related_player_id != null ? String(event.related_player_id) : '',
      minute: event.minute != null ? String(event.minute) : '',
    })
  }

  const onCancelEdit = () => {
    setEditingEventId(null)
    setEventError('')
    setEventForm(emptyEventForm)
  }

  const onSaveEvent = async () => {
    setEventError('')
    if (!eventForm.event_type) {
      setEventError('Select an event type.')
      return
    }
    if (!eventForm.team_id) {
      setEventError('Select a team.')
      return
    }
    if (!eventForm.player_id) {
      setEventError('Select a player.')
      return
    }
    const minute = Number(eventForm.minute)
    if (!Number.isInteger(minute) || minute < 0 || minute > 120) {
      setEventError('Minute must be a whole number between 0 and 120.')
      return
    }
    if (eventForm.event_type === 'assist' && !eventForm.related_player_id) {
      setEventError('An assist requires a related player.')
      return
    }

    const patch = {
      team_id: Number(eventForm.team_id),
      event_type: eventForm.event_type,
      minute,
      player_id: Number(eventForm.player_id),
      related_player_id:
        eventForm.event_type === 'assist' ? Number(eventForm.related_player_id) : null,
    }

    setEventSaving(true)
    const { error } = editingEventId
      ? await updateMatchEvent(editingEventId, patch)
      : await addMatchEvent({ match_id: fixture.id, ...patch })
    setEventSaving(false)
    if (error) {
      setEventError(error.message)
      toast.error(error.message)
      return
    }
    onCancelEdit()
    loadEvents()
    toast.success(editingEventId ? 'Event updated.' : 'Event added.')
  }

  const confirmRemoveEvent = () => {
    if (removeTarget == null) return
    setRemovingEventId(removeTarget)
    setEventError('')
    deleteMatchEvent(removeTarget).then(({ error }) => {
      setRemovingEventId(null)
      setRemoveTarget(null)
      if (error) {
        setEventError(error.message)
        toast.error(error.message)
        return
      }
      loadEvents()
      toast.success('Event deleted.')
    })
  }

  const teamOptions = [
    { value: String(fixture.home_team_id), label: homeName },
    { value: String(fixture.away_team_id), label: awayName },
  ]

  return (
    <PageContainer
      title={`Result — ${homeName} vs ${awayName}`}
      description="Enter the final score and record the match events."
    >
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <Link
            to={`/organizer/competitions/${fixture.competition_id}/fixtures`}
            className="text-sm font-medium text-brand-700 hover:underline"
          >
            &larr; Back to fixtures
          </Link>
          <Link
            to={`/matches/${fixture.id}`}
            className="text-sm font-medium text-brand-700 hover:underline"
          >
            View public page
          </Link>
        </div>

        {fetchError ? (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {fetchError}
          </p>
        ) : null}

        <div className="rounded-2xl border border-slate-200 bg-white">
          <dl className="divide-y divide-slate-100">
            <div className="flex items-center justify-between gap-4 px-6 py-4">
              <dt className="text-sm font-medium text-slate-600">Home team</dt>
              <dd className="text-sm font-semibold text-slate-900">{homeName}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 px-6 py-4">
              <dt className="text-sm font-medium text-slate-600">Away team</dt>
              <dd className="text-sm font-semibold text-slate-900">{awayName}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 px-6 py-4">
              <dt className="text-sm font-medium text-slate-600">Date</dt>
              <dd className="text-sm text-slate-900">{formatKickoffDate(fixture.start_time)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 px-6 py-4">
              <dt className="text-sm font-medium text-slate-600">Kickoff time</dt>
              <dd className="text-sm text-slate-900">{formatKickoffTime(fixture.start_time)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 px-6 py-4">
              <dt className="text-sm font-medium text-slate-600">Venue</dt>
              <dd className="text-sm text-slate-900">{fixture.venue?.name ?? '—'}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 px-6 py-4">
              <dt className="text-sm font-medium text-slate-600">Stage</dt>
              <dd className="text-sm text-slate-900">
                {fixture.stage_name ?? stageLabelFor(fixture.stage)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 px-6 py-4">
              <dt className="text-sm font-medium text-slate-600">Status</dt>
              <dd className="text-sm text-slate-900">
                <StatusBadge status={fixture.status} />
              </dd>
            </div>
          </dl>
        </div>

        <form
          onSubmit={handleSubmit(onSaveScore)}
          className="rounded-2xl border border-slate-200 bg-white p-6"
          noValidate
        >
          <h2 className="text-lg font-semibold text-slate-900">Result</h2>
          <p className="mt-1 text-sm text-slate-600">
            Saving marks the fixture as completed. Completed matches stay editable.
          </p>

          {scoreSaved ? (
            <p role="status" className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
              Result saved.
            </p>
          ) : null}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="home_score" className="mb-1 block text-sm font-medium text-slate-700">
                {homeName} — score
              </label>
              <input
                id="home_score"
                type="number"
                min="0"
                className={inputClass}
                {...register('home_score', {
                  valueAsNumber: true,
                  validate: (value) =>
                    Number.isInteger(Number(value)) && Number(value) >= 0
                      ? true
                      : 'Score must be a whole number of 0 or more',
                })}
              />
              {errors.home_score ? (
                <p role="alert" className="mt-1 text-xs text-red-600">{errors.home_score.message}</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="away_score" className="mb-1 block text-sm font-medium text-slate-700">
                {awayName} — score
              </label>
              <input
                id="away_score"
                type="number"
                min="0"
                className={inputClass}
                {...register('away_score', {
                  valueAsNumber: true,
                  validate: (value) =>
                    Number.isInteger(Number(value)) && Number(value) >= 0
                      ? true
                      : 'Score must be a whole number of 0 or more',
                })}
              />
              {errors.away_score ? (
                <p role="alert" className="mt-1 text-xs text-red-600">{errors.away_score.message}</p>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={scoreSaving}
              className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {scoreSaving ? 'Saving...' : fixture.status === 'completed' ? 'Save result' : 'Complete fixture'}
            </button>
          </div>
        </form>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">
            {editingEventId ? 'Edit event' : 'Add event'}
          </h2>

          {eventError ? (
            <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {eventError}
            </p>
          ) : null}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="event_type" className="mb-1 block text-sm font-medium text-slate-700">
                Event type
              </label>
              <select
                id="event_type"
                className={inputClass}
                value={eventForm.event_type}
                onChange={(event) => setFormField('event_type', event.target.value)}
              >
                <option value="">Select an event type</option>
                {EVENT_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="event_team" className="mb-1 block text-sm font-medium text-slate-700">
                Team
              </label>
              <select
                id="event_team"
                className={inputClass}
                value={eventForm.team_id}
                onChange={(event) => setFormField('team_id', event.target.value)}
              >
                <option value="">Select a team</option>
                {teamOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="event_player" className="mb-1 block text-sm font-medium text-slate-700">
                Player
              </label>
              <select
                id="event_player"
                className={inputClass}
                value={eventForm.player_id}
                onChange={(event) => setFormField('player_id', event.target.value)}
              >
                <option value="">Select a player</option>
                {playerOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="event_minute" className="mb-1 block text-sm font-medium text-slate-700">
                Minute
              </label>
              <input
                id="event_minute"
                type="number"
                min="0"
                max="120"
                className={inputClass}
                value={eventForm.minute}
                onChange={(event) => setFormField('minute', event.target.value)}
              />
            </div>
            {eventForm.event_type === 'assist' ? (
              <div>
                <label
                  htmlFor="event_related_player"
                  className="mb-1 block text-sm font-medium text-slate-700"
                >
                  Related player (scorer)
                </label>
                <select
                  id="event_related_player"
                  className={inputClass}
                  value={eventForm.related_player_id}
                  onChange={(event) => setFormField('related_player_id', event.target.value)}
                >
                  <option value="">Select the scorer</option>
                  {relatedPlayerOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex items-center justify-end gap-4">
            {editingEventId ? (
              <button
                type="button"
                onClick={onCancelEdit}
                className="text-sm font-medium text-slate-600 hover:text-slate-900"
              >
                Cancel
              </button>
            ) : null}
            <button
              type="button"
              disabled={eventSaving}
              onClick={onSaveEvent}
              className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {eventSaving ? 'Saving...' : editingEventId ? 'Save changes' : 'Add event'}
            </button>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Timeline</h2>
            {events.length > 0 ? (
              <span className="text-sm text-slate-500">{events.length} events</span>
            ) : null}
          </div>
          <MatchTimeline
            events={events}
            homeTeamId={fixture.home_team_id}
            awayTeamId={fixture.away_team_id}
            emptyText="No events recorded yet."
          />

          {events.length > 0 ? (
            <div className="mt-3 space-y-2">
              {[...events]
                .sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0) || a.id - b.id)
                .map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white px-4 py-2.5"
                  >
                    <span className="text-sm text-slate-400">{event.minute ?? '—'}'</span>
                    <span className="flex-1 text-sm text-slate-700">
                      {EVENT_TYPES.find((option) => option.value === event.event_type)?.label ??
                        event.event_type}{' '}
                      — {fullName(event.player)}
                      {event.event_type === 'assist' && event.related_player
                        ? ` (for ${fullName(event.related_player)})`
                        : ''}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEditing(event)}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={removingEventId === event.id}
                        onClick={() => setRemoveTarget(event.id)}
                        className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {removingEventId === event.id ? 'Removing...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          ) : null}
        </section>
      </div>

      <ConfirmDialog
        open={removeTarget !== null}
        title="Delete this match event?"
        message="This permanently removes the event from the timeline."
        confirmLabel="Delete event"
        busy={removingEventId !== null}
        onConfirm={() => void confirmRemoveEvent()}
        onCancel={() => setRemoveTarget(null)}
      />
    </PageContainer>
  )
}