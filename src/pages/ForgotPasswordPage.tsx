import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { supabase, isSupabaseConfigured } from '../services/supabase'
import PageContainer from '../components/PageContainer'

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'

interface ForgotPasswordFormValues {
  email: string
}

export default function ForgotPasswordPage() {
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>()

  const onSubmit = async ({ email }: ForgotPasswordFormValues) => {
    if (!isSupabaseConfigured) {
      setError(
        'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to continue.',
      )
      return
    }
    setSubmitting(true)
    setError('')
    setMessage('')
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setSubmitting(false)
    if (resetError) {
      setError(resetError.message)
      return
    }
    setMessage(
      'If an account exists for that email, a password reset link has been sent. Check your inbox.',
    )
  }

  return (
    <PageContainer title="Forgot password" description="Reset your SportsHub password.">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mx-auto max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6"
        noValidate
      >
        {error ? (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        {message ? (
          <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
            {message}
          </p>
        ) : null}

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className={inputClass}
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Enter a valid email address',
              },
            })}
          />
          {errors.email ? (
            <p role="alert" className="mt-1 text-xs text-red-600">{errors.email.message}</p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Sending link...' : 'Send reset link'}
        </button>

        <p className="text-center text-sm text-slate-600">
          Remembered it?{' '}
          <Link to="/login" className="font-medium text-brand-700 hover:underline">
            Back to login
          </Link>
        </p>
      </form>
    </PageContainer>
  )
}