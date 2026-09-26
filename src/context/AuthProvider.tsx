import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../services/supabase'
import { AuthContext, type AuthContextValue } from './AuthContext'
import type { Profile } from '../types/domain'

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [roles, setRoles] = useState<string[]>([])
  const [rolesLoading, setRolesLoading] = useState(!isSupabaseConfigured)
  const [loading, setLoading] = useState(!isSupabaseConfigured)

  const applyUser = useCallback((nextUser: User | null) => {
    setUser(nextUser)
    if (!nextUser) {
      setProfile(null)
      setRoles([])
      setRolesLoading(false)
    } else {
      setRolesLoading(true)
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) return

    supabase.auth
      .getSession()
      .then(({ data }) => {
        applyUser(data.session?.user ?? null)
        setLoading(false)
      })
      .catch(() => setLoading(false))

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applyUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [applyUser])

  useEffect(() => {
    if (!user) return undefined

    let active = true
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (active && data) setProfile(data as unknown as Profile)
      })

    return () => {
      active = false
    }
  }, [user])

  useEffect(() => {
    if (!user) return undefined

    let active = true
    supabase
      .from('profile_roles')
      .select('role_id, roles(code)')
      .eq('profile_id', user.id)
      .then(({ data }) => {
        if (!active) return
        const rows = (data ?? []) as { roles?: { code?: string } | null }[]
        const codes = rows
          .map((row) => row.roles?.code)
          .filter((code): code is string => typeof code === 'string')
        setRoles(codes)
        setRolesLoading(false)
      }, () => {
        if (active) setRolesLoading(false)
      })

    return () => {
      active = false
    }
  }, [user])

  const refreshProfile = useCallback(async (): Promise<Profile | null> => {
    if (!user) return null
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    if (data) setProfile(data as unknown as Profile)
    return (data as unknown as Profile) ?? null
  }, [user])

  const signOut = useCallback(async (): Promise<void> => {
    if (!isSupabaseConfigured) return
    await supabase.auth.signOut()
    applyUser(null)
  }, [applyUser])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      roles,
      rolesLoading,
      loading,
      isSupabaseConfigured,
      refreshProfile,
      signOut,
    }),
    [user, profile, roles, rolesLoading, loading, refreshProfile, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}