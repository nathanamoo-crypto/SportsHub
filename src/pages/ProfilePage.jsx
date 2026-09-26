import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '../services/supabase'
import { useAuth } from '../hooks/useAuth'
import PageContainer from '../components/PageContainer'
import LoadingSpinner from '../components/LoadingSpinner'

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'

export default function ProfilePage() {
  const { user, profile, loading, refreshProfile } = useAuth()
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
    if (profile) {
      reset({
        full_name: profile.full_name ?? '',
        avatar_url: profile.avatar_url ?? '',
      })
    }
  }, [profile, reset])

  if (loading || !profile) {
    return <LoadingSpinner label="Loading your profile..." />
  }

  const onSubmit = async ({ full_name, avatar_url }) => {
    setSaving(true)
    setServerError('')
    setSuccess(false)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: full_name.trim() || '', avatar_url: avatar_url.trim() || null })
      .eq('id', user.id)
    setSaving(false)
    if (error) {
      setServerError(error.message)
      return
    }
    setSuccess(true)
    refreshProfile()
  }

  return (
    <PageContainer title="Profile" description="View and update your account details.">
      <div className="mx-auto max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-6">
        <div>
          <p className="text-sm font-medium text-slate-700">Email</p>
          <p className="mt-1 text-sm text-slate-600">{user.email}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {serverError ? (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {serverError}
            </p>
          ) : null}
          {success ? (
            <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
              Profile updated.
            </p>
          ) : null}

          <div>
            <label htmlFor="full_name" className="mb-1 block text-sm font-medium text-slate-700">
              Full name
            </label>
            <input
              id="full_name"
              type="text"
              autoComplete="name"
              className={inputClass}
              {...register('full_name', { required: 'Full name is required' })}
            />
            {errors.full_name ? (
              <p role="alert" className="mt-1 text-xs text-red-600">{errors.full_name.message}</p>
            ) : null}
          </div>

          <div>
            <label htmlFor="avatar_url" className="mb-1 block text-sm font-medium text-slate-700">
              Avatar URL
            </label>
            <input
              id="avatar_url"
              type="url"
              placeholder="https://example.com/avatar.png"
              className={inputClass}
              {...register('avatar_url')}
            />
          </div>

          <button
            type="submit"
            disabled={saving || !isDirty}
            className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>
    </PageContainer>
  )
}