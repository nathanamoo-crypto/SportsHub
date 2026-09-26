import { createContext } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '../types/domain'

export interface AuthContextValue {
  user: User | null
  profile: Profile | null
  roles: string[]
  rolesLoading: boolean
  loading: boolean
  isSupabaseConfigured: boolean
  refreshProfile: () => Promise<Profile | null>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)