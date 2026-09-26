import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../hooks/useAuth'
import PageContainer from '../../components/PageContainer'
import type { CompetitionFormat, Sport } from '../../types/domain'
import {
  createCompetition,
  fetchFormats,
  fetchSports,
  isSlugTaken,
} from '../../services/competitions'
import { slugify } from '../../utils/slugify'

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'

interface CreateCompetitionFormValues {
  name: string
  description: string
  sport_id: string
  format_id: string
  location: string
  start_date: string
  end_date: string
}

export default function CreateCompetitionPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [sports, setSports] = useState<Sport[]>([])
  const [formats, setFormats] = useState<CompetitionFormat[]>([])
  const [referenceError, setReferenceError] = useState('')
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<CreateCompetitionFormValues>()

  useEffect(() => {
    let active = true
    Promise.all([fetchSports(), fetchFormats()]).then(([sportsResult, formatsResult]) => {
      if (!active) return
      if (sportsResult.error) setReferenceError(sportsResult.error.message)
      if (formatsResult.error) setReferenceError(formatsResult.error.message)
      setSports((sportsResult.data ?? []) as Sport[])
      setFormats((formatsResult.data ?? []) as unknown as CompetitionFormat[])
    })
    return () => {
      active = false
    }
  }, [])

  const onSubmit = async ({
    name,
    description,
    sport_id,
    format_id,
    location,
    start_date,
    end_date,
  }: CreateCompetitionFormValues) => {
    if (!user) return
    setServerError('')

    const slug = slugify(name)
    if (!slug) {
      setServerError('The competition name must contain letters or numbers to generate a slug.')
      return
    }

    const { data: existing } = await isSlugTaken(slug)
    if (existing) {
      setServerError('A competition with this name already exists.')
      return
    }

    setSubmitting(true)
    const { error } = await createCompetition({
      name: name.trim(),
      slug,
      description: description?.trim() || null,
      sport_id: Number(sport_id),
      format_id: Number(format_id),
      location: location?.trim() || null,
      start_date: start_date || null,
      end_date: end_date || null,
      organizer_id: user.id,
    })
    setSubmitting(false)

    if (error) {
      if (error.code === '23505') {
        setServerError('A competition with this name already exists.')
      } else {
        setServerError(error.message)
      }
      return
    }
    navigate('/organizer/competitions')
  }

  return (
    <PageContainer
      title="Create competition"
      description="Competitions are saved as drafts until you publish them."
    >
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
<textarea
              id="description"
              rows={3}
            className={inputClass}
            {...register('description')}
          />
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
          <input
            id="location"
            type="text"
            placeholder="City or venue area"
            className={inputClass}
            {...register('location')}
          />
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
            disabled={submitting}
            className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Creating...' : 'Create competition'}
          </button>
        </div>
      </form>
    </PageContainer>
  )
}