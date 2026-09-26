import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../hooks/useAuth'
import PageContainer from '../../components/PageContainer'
import LoadingSpinner from '../../components/LoadingSpinner'
import type { SquadMember, Team } from '../../types/domain'
import {
  addPlayer,
  fetchSquad,
  removeMembership,
  updatePlayer,
} from '../../services/squads'
import { fetchTeamById } from '../../services/teams'
import { formatDate } from '../../utils/date'
import { POSITIONS } from '../../utils/positions'

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'

interface PlayerFormValues {
  first_name: string
  last_name: string
  date_of_birth: string
  position: string
  shirt_number: number
}

interface EditingState {
  membershipId: number
  playerId: number
}

export default function TeamSquadPage() {
  const { id: idParam } = useParams()
  const id = idParam ?? ''
  const { user } = useAuth()
  const [team, setTeam] = useState<Team | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [squad, setSquad] = useState<SquadMember[] | null>(null)
  const [fetchError, setFetchError] = useState('')
  const [serverError, setServerError] = useState('')
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<EditingState | null>(null)
  const [removingId, setRemovingId] = useState<number | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PlayerFormValues>()

  const load = useCallback(() => {
    fetchSquad(id).then(({ data, error }) => {
      if (error) {
        setFetchError(error.message)
        return
      }
      setSquad((data ?? []) as unknown as SquadMember[])
    })
  }, [id])

  useEffect(() => {
    let active = true
    fetchTeamById(id).then(({ data, error }) => {
      if (!active) return
      if (error) {
        setFetchError(error.message)
        return
      }
      if (!data) {
        setNotFound(true)
        return
      }
      setTeam(data as unknown as Team)
    })
    return () => {
      active = false
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  if (notFound) {
    return (
      <PageContainer className="text-center">
        <p className="text-6xl font-extrabold text-brand-600">404</p>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Team not found</h1>
        <p className="mx-auto mt-2 max-w-md text-slate-600">
          This team does not exist or you do not have permission to manage it.
        </p>
        <Link
          to="/organizer/teams"
          className="mt-8 inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Back to your teams
        </Link>
      </PageContainer>
    )
  }

  if (!team || squad === null) {
    return <LoadingSpinner label="Loading squad..." />
  }

  const startEditing = (member: SquadMember) => {
    setEditing({ membershipId: member.id, playerId: member.players.id })
    setServerError('')
    reset({
      first_name: member.players.first_name,
      last_name: member.players.last_name,
      date_of_birth: member.players.date_of_birth ?? '',
      position: member.position ?? '',
      shirt_number: member.shirt_number ?? 0,
    })
  }

  const onCancel = () => {
    setEditing(null)
    setServerError('')
    reset({
      first_name: '',
      last_name: '',
      date_of_birth: '',
      position: '',
      shirt_number: 0,
    })
  }

  const onSubmit = async ({
    first_name,
    last_name,
    date_of_birth,
    position,
    shirt_number,
  }: PlayerFormValues) => {
    if (!user) return
    setSaving(true)
    setServerError('')
    const patch = {
      firstName: first_name,
      lastName: last_name,
      dateOfBirth: date_of_birth || null,
      position,
      shirtNumber: Number(shirt_number),
    }
    const { error } = editing
      ? await updatePlayer({ playerId: editing.playerId, membershipId: editing.membershipId, ...patch })
      : await addPlayer({ teamId: Number(id), createdBy: user.id, ...patch })
    setSaving(false)
    if (error) {
      setServerError(error.message)
      return
    }
    onCancel()
    load()
  }

  const handleRemove = (member: SquadMember) => {
    setRemovingId(member.id)
    setServerError('')
    removeMembership(member.id).then(({ error }) => {
      setRemovingId(null)
      if (error) {
        setServerError(error.message)
        return
      }
      load()
    })
  }

  const positionLabelFor = (value: string | null) =>
    POSITIONS.find((p) => p.value === value)?.label ?? '—'

  return (
    <PageContainer
      title={`Squad — ${team.name}`}
      description="Add players and manage squad numbers. Removing a player closes their membership without deleting history."
    >
      <div className="mx-auto max-w-3xl space-y-8">
        {fetchError || serverError ? (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {serverError || fetchError}
          </p>
        ) : null}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-2xl border border-slate-200 bg-white p-6"
          noValidate
        >
          <h2 className="text-lg font-semibold text-slate-900">
            {editing ? 'Edit player' : 'Add player'}
          </h2>

          <div className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="first_name" className="mb-1 block text-sm font-medium text-slate-700">
                  First name
                </label>
                <input
                  id="first_name"
                  type="text"
                  className={inputClass}
                  {...register('first_name', { required: 'First name is required' })}
                />
                {errors.first_name ? (
                  <p role="alert" className="mt-1 text-xs text-red-600">{errors.first_name.message}</p>
                ) : null}
              </div>
              <div>
                <label htmlFor="last_name" className="mb-1 block text-sm font-medium text-slate-700">
                  Last name
                </label>
                <input
                  id="last_name"
                  type="text"
                  className={inputClass}
                  {...register('last_name', { required: 'Last name is required' })}
                />
                {errors.last_name ? (
                  <p role="alert" className="mt-1 text-xs text-red-600">{errors.last_name.message}</p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="position" className="mb-1 block text-sm font-medium text-slate-700">
                  Position
                </label>
                <select
                  id="position"
                  className={inputClass}
                  {...register('position', { required: 'Position is required' })}
                >
                  <option value="">Select a position</option>
                  {POSITIONS.map((position) => (
                    <option key={position.value} value={position.value}>
                      {position.label}
                    </option>
                  ))}
                </select>
                {errors.position ? (
                  <p role="alert" className="mt-1 text-xs text-red-600">{errors.position.message}</p>
                ) : null}
              </div>
              <div>
                <label htmlFor="shirt_number" className="mb-1 block text-sm font-medium text-slate-700">
                  Shirt number
                </label>
                <input
                  id="shirt_number"
                  type="number"
                  min="1"
                  max="99"
                  className={inputClass}
                  {...register('shirt_number', {
                    valueAsNumber: true,
                    validate: (value) => {
                      const number = Number(value)
                      return Number.isInteger(number) && number >= 1 && number <= 99
                        ? true
                        : 'Shirt number must be between 1 and 99'
                    },
                  })}
                />
                {errors.shirt_number ? (
                  <p role="alert" className="mt-1 text-xs text-red-600">{errors.shirt_number.message}</p>
                ) : null}
              </div>
              <div>
                <label htmlFor="date_of_birth" className="mb-1 block text-sm font-medium text-slate-700">
                  Date of birth <span className="font-normal text-slate-400">(optional)</span>
                </label>
                <input id="date_of_birth" type="date" className={inputClass} {...register('date_of_birth')} />
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 pt-2">
              {editing ? (
                <button
                  type="button"
                  onClick={onCancel}
                  className="text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
              ) : null}
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Saving...' : editing ? 'Save changes' : 'Add player'}
              </button>
            </div>
          </div>
        </form>

        {squad.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-600">
            No players in the squad yet. Add the first one above.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">#</th>
                  <th className="px-4 py-3 font-semibold">Full name</th>
                  <th className="px-4 py-3 font-semibold">Position</th>
                  <th className="px-4 py-3 font-semibold">Date of birth</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {squad.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-semibold text-brand-700">
                      {member.shirt_number}
                    </td>
                    <td className="px-4 py-3 text-slate-900">
                      {member.players.first_name} {member.players.last_name}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{positionLabelFor(member.position)}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatDate(member.players.date_of_birth)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEditing(member)}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={removingId === member.id}
                          onClick={() => handleRemove(member)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {removingId === member.id ? 'Removing...' : 'Remove'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageContainer>
  )
}