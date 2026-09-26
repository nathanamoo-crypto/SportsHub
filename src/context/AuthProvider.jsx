import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../services/supabase'
import { AuthContext } from './AuthContext'

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [roles, setRoles] = useState([])
  const [rolesLoading, setRolesLoading] = useState(!isSupabaseConfigured)
  const [loading, setLoading] = useState(!isSupabaseConfigured)

  const applyUser = useCallback((nextUser) => {
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
        if (active && data) setProfile(data)
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
        const codes = (data ?? [])
          .map((row) => row.roles?.code)
          .filter((code) => typeof code === 'string')
        setRoles(codes)
        setRolesLoading(false)
      })
      .catch(() => {
        if (active) setRolesLoading(false)
      })

    return () => {
      active = false
    }
  }, [user])

  const refreshProfile = useCallback(async () => {
    if (!user) return null
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    if (data) setProfile(data)
    return data
  }, [user])

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) return
    await supabase.auth.signOut()
    applyUser(null)
  }, [applyUser])

  const value = useMemo(
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