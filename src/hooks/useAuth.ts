import { useState, useEffect } from 'react'
import { supabase, getProfile, type Profile } from '../services/supabase'
import type { User } from '@supabase/supabase-js'

export interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  hasProfile: boolean
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        getProfile().then(p => {
          setProfile(p)
          setLoading(false)
        })
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') return
      setUser(session?.user ?? null)
      if (session?.user) {
        getProfile().then(p => setProfile(p))
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const hasProfile = !!profile

  return { user, profile, loading, hasProfile }
}
