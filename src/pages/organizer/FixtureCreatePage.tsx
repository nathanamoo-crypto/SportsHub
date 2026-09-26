import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../hooks/useAuth'
import PageContainer from '../../components/PageContainer'
import LoadingSpinner from '../../components/LoadingSpinner'
import { fetchCompetitionById } from '../../services/competitions'
import { fetchTeamRegistrations } from '../../services/teams'
import {
  createFixture,
  fetchCompetitionFixtures,
  fetchVenues,
} from '../../services/fixtures'
import { combineDateTime } from '../../utils/date'
import { STAGE_TYPES, knockoutStagesFor, autoStageName } from '../../utils/stages'
import type {
  Competition,
  CompetitionTeamEntry,
  Match,
  MatchStage,
  MatchStageType,
  VenueRef,
} from '../../types/domain'

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'

interface FixtureFormValues {
  home_team_id: string
  away_team_id: string
  venue_id: string
  kickoff_date: string
  kickoff_time: string
  stage_type: MatchStageType
  knockout_stage: MatchStage
  stage_name: string
  round_number: number
}

export default function FixtureCreatePage() {
  const { id: idParam } = useParams()
  const id = idParam ?? ''
  const { user } = useAuth()
  const navigate = useNavigate()
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [registrations, setRegistrations] = useState<CompetitionTeamEntry[]>([])
  const [venues, setVenues] = useState<VenueRef[]>([])
  const [existing, setExisting] = useState<Match[]>([])
  const [referenceError, setReferenceError] = useState('')
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FixtureFormValues>({
    defaultValues: {
      home_team_id: '',
      away_team_id: '',
      venue_id: '',
      kickoff_date: '',
      kickoff_time: '',
      stage_type: 'league',
      knockout_stage: 'quarterfinal',
      stage_name: '',
      round_number: 1,
    },
  })

  const stageType = getValues('stage_type')
  const roundNumber = getValues('round_number')
  const savedStageName = autoStageName(stageType, getValues('knockout_stage'), roundNumber)

  useEffect(() => {
    if (!user) return undefined
    let active = true
    Promise.all([
      fetchCompetitionById(id),
      fetchTeamRegistrations(id),
      fetchVenues(),
      fetchCompetitionFixtures(id),
    ]).then(([competitionResult, teamsResult, venuesResult, fixturesResult]) => {
      if (!active) return
      if (competitionResult.error) {
        setReferenceError(competitionResult.error.message)
        return
      }
      if (!competitionResult.data) {
        setNotFound(true)
        return
      }
      setCompetition(competitionResult.data as unknown as Competition)
      if (teamsResult.error || venuesResult.error || fixturesResult.error) {
        setReferenceError(
          teamsResult.error?.message || venuesResult.error?.message || fixturesResult.error?.message || '',
        )
      }
      setRegistrations((teamsResult.data ?? []) as unknown as CompetitionTeamEntry[])
      setVenues((venuesResult.data ?? []) as unknown as VenueRef[])
      setExisting((fixturesResult.data ?? []) as unknown as Match[])
    })
    return () => {
      active = false
    }
  }, [id, user])

  const registeredTeams = useMemo(
    () => registrations.filter((entry) => entry.status === 'active'),
    [registrations],
  )

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

  if (!competition) {
    return <LoadingSpinner label="Loading competition..." />
  }

  const onSubmit = async ({
    home_team_id,
    away_team_id,
    venue_id,
    kickoff_date,
    kickoff_time,
    stage_type,
    knockout_stage,
    stage_name,
    round_number,
  }: FixtureFormValues) => {
    if (!competition) return
    setServerError('')
    const homeTeamId = Number(home_team_id)
    const awayTeamId = Number(away_team_id)

    if (homeTeamId === awayTeamId) {
      setServerError('Home and away teams must be different.')
      return
    }

    const activeIds = new Set(registeredTeams.map((entry) => entry.teams.id))
    if (!activeIds.has(homeTeamId) || !activeIds.has(awayTeamId)) {
      setServerError('Both teams must be registered in this competition.')
      return
    }

    const startTime = combineDateTime(kickoff_date, kickoff_time)

    const stage = stage_type === 'knockout' ? knockout_stage : stage_type
    const stageName =
      stage_type === 'group' ? stage_name.trim() : autoStageName(stage_type, stage, round_number)
    if (stage_type === 'group' && !stageName) {
      setServerError('Group stages require a stage name (e.g. Group A).')
      return
    }

    const duplicate = existing.find(
      (fixture) =>
        fixture.home_team_id === homeTeamId &&
        fixture.away_team_id === awayTeamId &&
        fixture.start_time === startTime,
    )
    if (duplicate) {
      setServerError('A fixture for this pairing at the same kickoff time already exists.')
      return
    }

    setSubmitting(true)
    const { error } = await createFixture({
      competition_id: competition.id,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      venue_id: venue_id ? Number(venue_id) : null,
      start_time: startTime,
      stage_type,
      stage,
      stage_name: stageName,
      round_number: Number(round_number),
    })
    setSubmitting(false)
    if (error) {
      if (error.code === '23505') {
        setServerError('A fixture for this pairing at the same kickoff time already exists.')
      } else if (error.code === '23503') {
        setServerError('One of the selected teams is not registered in this competition.')
      } else if (error.code === '23514') {
        setServerError('Invalid fixture values — teams must be distinct and stage values valid.')
      } else {
        setServerError(error.message)
      }
      return
    }
    navigate(`/organizer/competitions/${competition.id}/fixtures`)
  }

  const knockoutOptions = knockoutStagesFor(stageType)

  return (
    <PageContainer
      title="Schedule fixture"
      description="Create a single fixture between teams registered in this competition."
    >
      <div className="mx-auto max-w-2xl">
        <div className="mb-4">
          <Link
            to={`/organizer/competitions/${competition.id}/fixtures`}
            className="text-sm font-medium text-brand-700 hover:underline"
          >
            &larr; Back to fixtures
          </Link>
        </div>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6"
          noValidate
        >
          {referenceError ? (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {referenceError}
            </p>
          ) : null}
          {serverError ? (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {serverError}
            </p>
          ) : null}
          {registeredTeams.length < 2 ? (
            <p role="alert" className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              This competition needs at least two registered teams before fixtures can be scheduled.
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="home_team_id" className="mb-1 block text-sm font-medium text-slate-700">
                Home team
              </label>
              <select
                id="home_team_id"
                className={inputClass}
                {...register('home_team_id', { required: 'Home team is required' })}
              >
                <option value="">Select a home team</option>
                {registeredTeams.map((entry) => (
                  <option key={entry.id} value={entry.teams.id}>
                    {entry.teams.name}
                  </option>
                ))}
              </select>
              {errors.home_team_id ? (
                <p role="alert" className="mt-1 text-xs text-red-600">{errors.home_team_id.message}</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="away_team_id" className="mb-1 block text-sm font-medium text-slate-700">
                Away team
              </label>
              <select
                id="away_team_id"
                className={inputClass}
                {...register('away_team_id', {
                  required: 'Away team is required',
                  validate: (value) =>
                    !value || value !== getValues('home_team_id')
                      ? true
                      : 'Home and away teams must be different',
                })}
              >
                <option value="">Select an away team</option>
                {registeredTeams.map((entry) => (
                  <option key={entry.id} value={entry.teams.id}>
                    {entry.teams.name}
                  </option>
                ))}
              </select>
              {errors.away_team_id ? (
                <p role="alert" className="mt-1 text-xs text-red-600">{errors.away_team_id.message}</p>
              ) : null}
            </div>
          </div>

          <div>
            <label htmlFor="venue_id" className="mb-1 block text-sm font-medium text-slate-700">
              Venue <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <select id="venue_id" className={inputClass} {...register('venue_id')}>
              <option value="">No venue</option>
              {venues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name}
                  {venue.city ? ` — ${venue.city}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="kickoff_date" className="mb-1 block text-sm font-medium text-slate-700">
                Date
              </label>
              <input
                id="kickoff_date"
                type="date"
                className={inputClass}
                {...register('kickoff_date', { required: 'Kickoff date is required' })}
              />
              {errors.kickoff_date ? (
                <p role="alert" className="mt-1 text-xs text-red-600">{errors.kickoff_date.message}</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="kickoff_time" className="mb-1 block text-sm font-medium text-slate-700">
                Kickoff time
              </label>
              <input
                id="kickoff_time"
                type="time"
                className={inputClass}
                {...register('kickoff_time', { required: 'Kickoff time is required' })}
              />
              {errors.kickoff_time ? (
                <p role="alert" className="mt-1 text-xs text-red-600">{errors.kickoff_time.message}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="stage_type" className="mb-1 block text-sm font-medium text-slate-700">
                Stage type
              </label>
              <select id="stage_type" className={inputClass} {...register('stage_type')}>
                {STAGE_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="knockout_stage" className="mb-1 block text-sm font-medium text-slate-700">
                Stage
              </label>
              {stageType === 'knockout' ? (
                <select id="knockout_stage" className={inputClass} {...register('knockout_stage')}>
                  {knockoutOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={stageType === 'league' ? 'League' : 'Group'}
                  className={`${inputClass} bg-slate-50 text-slate-500`}
                  disabled
                />
              )}
              {stageType !== 'knockout' ? null : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="stage_name" className="mb-1 block text-sm font-medium text-slate-700">
                Stage name
              </label>
              {stageType === 'group' ? (
                <>
                  <input
                    id="stage_name"
                    type="text"
                    placeholder="Group A"
                    className={inputClass}
                    {...register('stage_name', {
                      validate: () =>
                        stageType !== 'group' || getValues('stage_name').trim().length > 0
                          ? true
                          : 'Group stages require a name (e.g. Group A)',
                    })}
                  />
                  {errors.stage_name ? (
                    <p role="alert" className="mt-1 text-xs text-red-600">{errors.stage_name.message}</p>
                  ) : null}
                </>
              ) : (
                <input
                  type="text"
                  value={savedStageName ?? ''}
                  className={`${inputClass} bg-slate-50 text-slate-500`}
                  disabled
                />
              )}
            </div>
            <div>
              <label htmlFor="round_number" className="mb-1 block text-sm font-medium text-slate-700">
                Round number
              </label>
              <input
                id="round_number"
                type="number"
                min="1"
                className={inputClass}
                {...register('round_number', {
                  valueAsNumber: true,
                  validate: (value) =>
                    Number.isInteger(Number(value)) && Number(value) >= 1
                      ? true
                      : 'Round number must be at least 1',
                })}
              />
              {errors.round_number ? (
                <p role="alert" className="mt-1 text-xs text-red-600">{errors.round_number.message}</p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 pt-2">
            <Link
              to={`/organizer/competitions/${competition.id}/fixtures`}
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting || registeredTeams.length < 2}
              className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Scheduling...' : 'Schedule fixture'}
            </button>
          </div>
        </form>
      </div>
    </PageContainer>
  )
}