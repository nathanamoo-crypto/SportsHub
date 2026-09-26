import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../hooks/useAuth'
import PageContainer from '../../components/PageContainer'
import LoadingSpinner from '../../components/LoadingSpinner'
import {
  fetchManagerCandidates,
  fetchTeamById,
  updateTeam,
} from '../../services/teams'

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'

export default function TeamEditPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [team, setTeam] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [managers, setManagers] = useState([])
  const [referenceError, setReferenceError] = useState('')
  const [serverError, setServerError] = useState('')
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm()

  useEffect(() => {
    let active = true
    fetchManagerCandidates().then(({ data, error }) => {
      if (!active) return
      if (error) setReferenceError(error.message)
      setManagers(data ?? [])
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    let active = true
    fetchTeamById(id).then(({ data, error }) => {
      if (!active) return
      if (error) {
        setServerError(error.message)
        return
      }
      if (!data) {
        setNotFound(true)
        return
      }
      setTeam(data)
    })
    return () => {
      active = false
    }
  }, [id])

  useEffect(() => {
    if (team) {
      reset({
        name: team.name,
        logo_url: team.logo_url ?? '',
        manager_id: team.manager_id ?? '',
        is_active: team.is_active,
      })
    }
  }, [team, reset])

  if (notFound) {
    return (
      <PageContainer className="text-center">
        <p className="text-6xl font-extrabold text-brand-600">404</p>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Team not found</h1>
        <p className="mx-auto mt-2 max-w-md text-slate-600">
          This team does not exist or you do not have permission to edit it.
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

  if (!team) {
    return <LoadingSpinner label="Loading team..." />
  }

  const onSubmit = async ({ name, logo_url, manager_id, is_active }) => {
    setSaving(true)
    setServerError('')
    setSuccess(false)
    const { error } = await updateTeam(id, user.id, {
      name: name.trim(),
      logo_url: logo_url?.trim() || null,
      manager_id: manager_id || null,
      is_active: Boolean(is_active),
    })
    setSaving(false)
    if (error) {
      setServerError(error.message)
      return
    }
    setSuccess(true)
  }

  return (
    <PageContainer title="Edit team" description={`Update the details of ${team.name}.`}>
      <div className="mx-auto max-w-2xl">
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
              Team saved.
            </p>
          ) : null}

          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-slate-700">
              Team name
            </label>
            <input
              id="name"
              type="text"
              className={inputClass}
              {...register('name', { required: 'Team name is required' })}
            />
            {errors.name ? (
              <p role="alert" className="mt-1 text-xs text-red-600">{errors.name.message}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="logo_url" className="mb-1 block text-sm font-medium text-slate-700">
              Logo URL
            </label>
            <input
              id="logo_url"
              type="url"
              placeholder="https://example.com/logo.png"
              className={inputClass}
              {...register('logo_url')}
            />
          </div>

          <div>
            <label htmlFor="manager_id" className="mb-1 block text-sm font-medium text-slate-700">
              Manager <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <select id="manager_id" className={inputClass} {...register('manager_id')}>
              <option value="">No manager assigned</option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.full_name}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              {...register('is_active')}
            />
            Active team
          </label>

          <div className="flex items-center justify-between gap-4 pt-2">
            <Link
              to="/organizer/teams"
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
      </div>
    </PageContainer>
  )
}