import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../context/ToastContext'
import PageContainer from '../../components/PageContainer'
import LogoUploader from '../../components/LogoUploader'
import usePageMeta from '../../hooks/usePageMeta'
import type { ManagerCandidate } from '../../types/domain'
import {
  createTeam,
  fetchManagerCandidates,
  isTeamSlugTaken,
  updateTeam,
} from '../../services/teams'
import { uploadTeamLogo } from '../../services/storage'
import { slugify } from '../../utils/slugify'

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'

interface TeamFormValues {
  name: string
  logo_url: string
  manager_id: string
  is_active: boolean
}

export default function TeamCreatePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [managers, setManagers] = useState<ManagerCandidate[]>([])
  const [referenceError, setReferenceError] = useState('')
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null)
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TeamFormValues>({ defaultValues: { is_active: true } })

  usePageMeta('Create team — SportsHub', 'Create a team on SportsHub.')

  useEffect(() => {
    let active = true
    fetchManagerCandidates().then(({ data, error }) => {
      if (!active) return
      if (error) setReferenceError(error.message)
      setManagers((data ?? []) as ManagerCandidate[])
    })
    return () => {
      active = false
    }
  }, [])

  const onSubmit = async ({ name, manager_id, is_active }: TeamFormValues) => {
    if (!user) return
    setServerError('')

    const slug = slugify(name)
    if (!slug) {
      setServerError('The team name must contain letters or numbers to generate a slug.')
      return
    }

    const { data: existing } = await isTeamSlugTaken(slug)
    if (existing) {
      setServerError('A team with this name already exists.')
      return
    }

    setSubmitting(true)
    const normalizedName = name.trim()
    const normalizedManager = manager_id || null

    const { data: created, error } = await createTeam({
      name: normalizedName,
      slug,
      logo_url: logoUrl,
      manager_id: normalizedManager,
      is_active: Boolean(is_active),
      owner_id: user.id,
    })
    setSubmitting(false)

    if (error) {
      if (error.code === '23505') {
        setServerError('A team with this name already exists.')
      } else {
        setServerError(error.message)
      }
      return
    }

    const teamId = created?.id
    if (teamId && pendingLogoFile) {
      const { data: upload } = await uploadTeamLogo(teamId, pendingLogoFile)
      if (!upload) {
        toast.error('Team created, but the logo could not be uploaded.')
      } else {
        await updateTeam(teamId, user.id, {
          name: normalizedName,
          logo_url: upload.url,
          manager_id: normalizedManager,
          is_active: Boolean(is_active),
        })
      }
    }

    toast.success('Team created.')
    navigate('/organizer/teams')
  }

  return (
    <PageContainer title="Create team" description="Teams are global, so they can enter many competitions.">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-slate-200 bg-white p-6"
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

        <LogoUploader
          teamId={null}
          value={logoUrl}
          onChange={(url) => {
            setLogoUrl(url)
            setValue('logo_url', url ?? '', { shouldDirty: true })
          }}
          onFile={setPendingLogoFile}
        />

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
            disabled={submitting}
            className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Creating...' : 'Create team'}
          </button>
        </div>
      </form>
    </PageContainer>
  )
}