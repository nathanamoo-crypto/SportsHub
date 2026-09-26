export type FriendlyErrorKind =
  | 'config'
  | 'auth'
  | 'network'
  | 'duplicate'
  | 'not_found'
  | 'database'
  | 'unknown'

export interface FriendlyError {
  kind: FriendlyErrorKind
  title: string
  message: string
}

interface ErrorLike {
  code?: string | null
  message?: string
}

export function describeError(error: ErrorLike | null | undefined): FriendlyError {
  if (!error) {
    return {
      kind: 'unknown',
      title: 'Something went wrong',
      message: 'An unexpected error occurred. Please try again.',
    }
  }

  const message = error.message ?? ''

  if (error.code === 'NOT_CONFIGURED') {
    return {
      kind: 'config',
      title: 'Supabase is not configured',
      message: 'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment to run the app.',
    }
  }

  if (
    message.includes('Failed to fetch') ||
    message.includes('NetworkError') ||
    message.toLowerCase().includes('network') ||
    message.toLowerCase().includes('fetch failed')
  ) {
    return {
      kind: 'network',
      title: 'Connection problem',
      message:
        'SportsHub could not reach its database. Check your connection and try again.',
    }
  }

  if (error.code === '23505') {
    return {
      kind: 'duplicate',
      title: 'Already exists',
      message: 'That value is already in use — please choose a different one.',
    }
  }

  if (error.code === 'PGRST116' || message.toLowerCase().includes('no rows')) {
    return {
      kind: 'not_found',
      title: 'Not found',
      message: 'The requested resource could not be found.',
    }
  }

  if (
    error.code === '42501' ||
    message.toLowerCase().includes('permission denied') ||
    message.toLowerCase().includes('infinite recursion') ||
    message.toLowerCase().includes('row-level security')
  ) {
    return {
      kind: 'auth',
      title: 'Permission denied',
      message: 'Your account does not have permission to do that.',
    }
  }

  return {
    kind: 'database',
    title: 'Something went wrong',
    message: message || 'An unexpected error occurred. Please try again.',
  }
}