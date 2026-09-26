import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { supabase, isSupabaseConfigured } from '../services/supabase'
import { useAuth } from '../hooks/useAuth'
import PageContainer from '../components/PageContainer'

const inputClass =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500'

interface LoginFormValues {
  email: string
  password: string
}

interface LoginLocationState {
  from?: string
  notice?: string
}

export default function LoginPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const loginState = location.state as LoginLocationState | null
  const [serverError, setServerError] = useState('')
  const [notice] = useState(loginState?.notice ?? '')
  const [submitting, setSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>()

  const from = loginState?.from ?? '/dashboard'

  useEffect(() => {
    if (user) navigate(from, { replace: true })
  }, [user, from, navigate])

  const onSubmit = async ({ email, password }: LoginFormValues) => {
    if (!isSupabaseConfigured) {
      setServerError(
        'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to continue.',
      )
      return
    }
    setSubmitting(true)
    setServerError('')
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    setSubmitting(false)
    if (error) setServerError(error.message)
  }

  return (
    <PageContainer title="Login" description="Sign in to your SportsHub account.">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mx-auto max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6"
        noValidate
      >
        {notice ? (
          <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
            {notice}
          </p>
        ) : null}
        {serverError ? (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {serverError}
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

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
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

        <div className="flex items-center justify-between">
          <Link to="/forgot-password" className="text-sm font-medium text-brand-700 hover:underline">
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>

        <p className="text-center text-sm text-slate-600">
          Do not have an account?{' '}
          <Link to="/register" className="font-medium text-brand-700 hover:underline">
            Register
          </Link>
        </p>
      </form>
    </PageContainer>
  )
}