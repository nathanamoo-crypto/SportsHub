import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { supabase, isSupabaseConfigured } from '../services/supabase'
import { useAuth } from '../hooks/useAuth'
import PageContainer from '../components/PageContainer'

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'

interface RegisterFormValues {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
}

export default function RegisterPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')
  const [registered, setRegistered] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<RegisterFormValues>()

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  const onSubmit = async ({ firstName, lastName, email, password }: RegisterFormValues) => {
    if (!isSupabaseConfigured) {
      setServerError(
        'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to continue.',
      )
      return
    }
    setSubmitting(true)
    setServerError('')
    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim()
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { full_name: fullName },
      },
    })
    setSubmitting(false)

    if (error) {
      setServerError(error.message)
      return
    }
    if (!data.session) {
      setRegistered(true)
    }
  }

  if (registered) {
    return (
      <PageContainer title="Check your inbox" description="Almost there.">
        <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-sm text-slate-700">
            Your account has been created. A confirmation email has been sent — open the
            link in the email to activate your account, then sign in.
          </p>
          <Link
            to="/login"
            className="mt-4 inline-block rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Go to login
          </Link>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer title="Register" description="Create your SportsHub account.">
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

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="mb-1 block text-sm font-medium text-slate-700">
              First name
            </label>
            <input
              id="firstName"
              type="text"
              autoComplete="given-name"
              className={inputClass}
              {...register('firstName', { required: 'First name is required' })}
            />
            {errors.firstName ? (
              <p role="alert" className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>
            ) : null}
          </div>
          <div>
            <label htmlFor="lastName" className="mb-1 block text-sm font-medium text-slate-700">
              Last name
            </label>
            <input
              id="lastName"
              type="text"
              autoComplete="family-name"
              className={inputClass}
              {...register('lastName', { required: 'Last name is required' })}
            />
            {errors.lastName ? (
              <p role="alert" className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>
            ) : null}
          </div>
        </div>

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

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
            Password
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
            Confirm password
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
          {submitting ? 'Creating account...' : 'Create account'}
        </button>

        <p className="text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-700 hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </PageContainer>
  )
}