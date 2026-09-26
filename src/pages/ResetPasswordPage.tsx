import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { supabase } from '../services/supabase'
import { useAuth } from '../hooks/useAuth'
import PageContainer from '../components/PageContainer'
import LoadingSpinner from '../components/LoadingSpinner'

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'

interface ResetPasswordFormValues {
  password: string
  confirmPassword: string
}

export default function ResetPasswordPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>()

  if (loading) {
    return <LoadingSpinner label="Checking your reset link..." />
  }

  const onSubmit = async ({ password }: ResetPasswordFormValues) => {
    setSubmitting(true)
    setServerError('')
    const { error } = await supabase.auth.updateUser({ password })
    setSubmitting(false)
    if (error) {
      setServerError(error.message)
      return
    }
    await supabase.auth.signOut()
    navigate('/login', { replace: true, state: { notice: 'Your password has been updated. Sign in with your new password.' } })
  }

  if (!user) {
    return (
      <PageContainer title="Invalid reset link" description="This link has expired or was already used.">
        <div className="mx-auto max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-700">
            Request a new password reset link to try again.
          </p>
          <Link
            to="/forgot-password"
            className="inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Request a new link
          </Link>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer title="Set a new password" description="Choose a new password for your account.">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mx-auto max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6"
        noValidate
      >
        {serverError ? (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {serverError}
          </p>
        ) : null}

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
            New password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            className={inputClass}
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 6, message: 'Password must be at least 6 characters' },
            })}
          />
          {errors.password ? (
            <p role="alert" className="mt-1 text-xs text-red-600">{errors.password.message}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-1 block text-sm font-medium text-slate-700">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            className={inputClass}
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (value) => value === getValues('password') || 'Passwords do not match',
            })}
          />
          {errors.confirmPassword ? (
            <p role="alert" className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Updating password...' : 'Update password'}
        </button>
      </form>
    </PageContainer>
  )
}