import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../hooks/useAuth'
import PageContainer from '../../components/PageContainer'
import LoadingSpinner from '../../components/LoadingSpinner'
import StatusBadge from '../../components/StatusBadge'
import {
  fetchCompetitionById,
  fetchFormats,
  fetchSports,
  publishCompetition,
  updateCompetition,
} from '../../services/competitions'
import { fetchOwnedTeams, fetchTeamRegistrations, registerTeam } from '../../services/teams'

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'

export default function EditCompetitionPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [competition, setCompetition] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [sports, setSports] = useState([])
  const [formats, setFormats] = useState([])
  const [referenceError, setReferenceError] = useState('')
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [registrations, setRegistrations] = useState(null)
  const [ownedTeams, setOwnedTeams] = useState([])
  const [registerError, setRegisterError] = useState('')
  const [registerSuccess, setRegisterSuccess] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [teamId, setTeamId] = useState('')
  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors, isDirty },
  } = useForm()

  useEffect(() => {
    let active = true
    Promise.all([fetchSports(), fetchFormats()]).then(([sportsResult, formatsResult]) => {
      if (!active) return
      if (sportsResult.error) setReferenceError(sportsResult.error.message)
      if (formatsResult.error) setReferenceError(formatsResult.error.message)
      setSports(sportsResult.data ?? [])
      setFormats(formatsResult.data ?? [])
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    fetchCompetitionById(id).then(({ data, error }) => {
      if (!active) return
      if (error) {
        setServerError(error.message)
        return
      }
      if (!data) {
        setNotFound(true)
        return
      }
      setCompetition(data)
    })
    return () => {
      active = false
    }
  }, [id])

  useEffect(() => {
    if (competition) {
      reset({
        name: competition.name,
        description: competition.description ?? '',
        sport_id: String(competition.sport_id),
        format_id: String(competition.format_id),
        location: competition.location ?? '',
        start_date: competition.start_date ?? '',
        end_date: competition.end_date ?? '',
      })
    }
  }, [competition, reset])

  const loadRegistrations = useCallback((competitionId) => {
    fetchTeamRegistrations(competitionId).then(({ data, error }) => {
      if (error) {
        setRegisterError(error.message)
        return
      }
      setRegistrations(data ?? [])
    })
  }, [])

  const loadOwnedTeams = useCallback((organizerId) => {
    fetchOwnedTeams(organizerId).then(({ data, error }) => {
      if (error) {
        setRegisterError(error.message)
        return
      }
      setOwnedTeams(data ?? [])
    })
  }, [])

  useEffect(() => {
    if (!competition) return undefined
    loadRegistrations(competition.id)
    loadOwnedTeams(user.id)
    return undefined
  }, [competition, user, loadRegistrations, loadOwnedTeams])

  const handleRegister = async () => {
    if (!teamId) return
    setRegistering(true)
    setRegisterError('')
    setRegisterSuccess(false)
    const { error } = await registerTeam(Number(competition.id), Number(teamId))
    setRegistering(false)
    if (error) {
      setRegisterError(error.message)
      return
    }
    setTeamId('')
    setRegisterSuccess(true)
    loadRegistrations(competition.id)
    loadOwnedTeams(user.id)
  }

  const registeredEntries = registrations ?? []
  const registeredIds = new Set(registeredEntries.map((entry) => entry.teams?.id))
  const availableTeams = ownedTeams.filter((team) => !registeredIds.has(team.id))

  if (notFound) {
    return (
      <PageContainer className="text-center">
        <p className="text-6xl font-extrabold text-brand-600">404</p>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Competition not found</h1>
        <p className="mx-auto mt-2 max-w-md text-slate-600">
          This competition does not exist or you do not have permission to edit it.
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

  const handlePublish = async () => {
    setPublishing(true)
    setServerError('')
    setSuccess(false)
    const { error } = await publishCompetition(id, user.id)
    setPublishing(false)
    if (error) {
      setServerError(error.message)
      return
    }
    const fresh = await fetchCompetitionById(id)
    if (fresh.data) setCompetition(fresh.data)
  }

  const onSubmit = async ({ name, description, sport_id, format_id, location, start_date, end_date }) => {
    setSaving(true)
    setServerError('')
    setSuccess(false)
    const { error } = await updateCompetition(id, user.id, {
      name: name.trim(),
      description: description?.trim() || null,
      sport_id: Number(sport_id),
      format_id: Number(format_id),
      location: location?.trim() || null,
      start_date: start_date || null,
      end_date: end_date || null,
    })
    setSaving(false)
    if (error) {
      setServerError(error.message)
      return
    }
    setSuccess(true)
    const fresh = await fetchCompetitionById(id)
    if (fresh.data) setCompetition(fresh.data)
  }

  return (
    <PageContainer title="Edit competition" description="Update the details of your competition.">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-6 py-4">
          <div>
            <p className="text-sm font-medium text-slate-600">Current status</p>
            <div className="mt-1">
              <StatusBadge status={competition.status} />
            </div>
          </div>
          {competition.status === 'draft' ? (
            <button
              type="button"
              disabled={publishing}
              onClick={handlePublish}
              className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {publishing ? 'Publishing...' : 'Publish'}
            </button>
          ) : null}
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
          {success ? (
            <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
              Competition saved.
            </p>
          ) : null}

          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
              Competition name
            </label>
            <input
              id="name"
              type="text"
              className={inputClass}
              {...register('name', { required: 'Competition name is required' })}
            />
            {errors.name ? (
              <p role="alert" className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea id="description" rows="3" className={inputClass} {...register('description')} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="sport_id" className="mb-1 block text-sm font-medium text-slate-700">
                Sport
              </label>
              <select
                id="sport_id"
                className={inputClass}
                {...register('sport_id', { required: 'Sport is required' })}
              >
                <option value="">Select a sport</option>
                {sports.map((sport) => (
                  <option key={sport.id} value={sport.id}>
                    {sport.name}
                  </option>
                ))}
              </select>
              {errors.sport_id ? (
                <p role="alert" className="mt-1 text-xs text-red-600">{errors.sport_id.message}</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="format_id" className="mb-1 block text-sm font-medium text-slate-700">
                Format
              </label>
              <select
                id="format_id"
                className={inputClass}
                {...register('format_id', { required: 'Format is required' })}
              >
                <option value="">Select a format</option>
                {formats.map((format) => (
                  <option key={format.id} value={format.id}>
                    {format.name}
                  </option>
                ))}
              </select>
              {errors.format_id ? (
                <p role="alert" className="mt-1 text-xs text-red-600">{errors.format_id.message}</p>
              ) : null}
            </div>
          </div>

          <div>
            <label htmlFor="location" className="mb-1 block text-sm font-medium text-slate-700">
              Location
            </label>
            <input id="location" type="text" className={inputClass} {...register('location')} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="start_date" className="mb-1 block text-sm font-medium text-slate-700">
                Start date
              </label>
              <input id="start_date" type="date" className={inputClass} {...register('start_date', { required: 'Start date is required' })} />
              {errors.start_date ? (
                <p role="alert" className="mt-1 text-xs text-red-600">{errors.start_date.message}</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="end_date" className="mb-1 block text-sm font-medium text-slate-700">
                End date
              </label>
              <input
                id="end_date"
                type="date"
                className={inputClass}
                {...register('end_date', {
                  required: 'End date is required',
                  validate: (value) =>
                    !value || !getValues('start_date') || value >= getValues('start_date')
                      ? true
                      : 'End date must be on or after the start date',
                })}
              />
              {errors.end_date ? (
                <p role="alert" className="mt-1 text-xs text-red-600">{errors.end_date.message}</p>
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 pt-2">
            <Link
              to="/organizer/competitions"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving || !isDirty}
              className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>

        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">Registered teams</h2>
          {registerError ? (
            <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {registerError}
            </p>
          ) : null}
          {registerSuccess ? (
            <p role="status" className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
              Team registered.
            </p>
          ) : null}

          {registeredEntries.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-600">
              No teams registered yet.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {registeredEntries.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3"
                >
                  <Link
                    to={`/teams/${entry.teams.slug}`}
                    className="text-sm font-medium text-brand-700 hover:underline"
                  >
                    {entry.teams.name}
                  </Link>
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {entry.status}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <select
              aria-label="Select a team to register"
              value={teamId}
              onChange={(event) => setTeamId(event.target.value)}
              className={inputClass}
            >
              <option value="">Select a team to register</option>
              {availableTeams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={registering || !teamId}
              onClick={handleRegister}
              className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {registering ? 'Registering...' : 'Register team'}
            </button>
          </div>
          {availableTeams.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500">
              All of your teams are already registered.
            </p>
          ) : null}
        </section>
      </div>
    </PageContainer>
  )
}