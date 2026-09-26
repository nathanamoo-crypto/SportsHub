import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { PostgrestError } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// The client is only ever used after an `isSupabaseConfigured` guard, so a
// null-typed client would force non-null assertions at every call site. We
// expose it as `SupabaseClient` and rely on the guard for runtime safety.
export const supabase = (isSupabaseConfigured
  ? createClient(supabaseUrl ?? '', supabaseAnonKey ?? '')
  : null) as unknown as SupabaseClient

export function notConfiguredResult(): { data: null; error: PostgrestError } {
  return {
    data: null,
    error: {
      name: 'SupabaseError',
      message: 'Supabase is not configured.',
      details: '',
      hint: '',
      code: 'NOT_CONFIGURED',
      toJSON: () => ({
        name: 'SupabaseError',
        message: 'Supabase is not configured.',
        details: '',
        hint: '',
        code: 'NOT_CONFIGURED',
      }),
    },
  }
}