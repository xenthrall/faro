import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session, UserAttributes } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { AuthContext, type AuthStatus, type SignInWithPasswordCredentials } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  useEffect(() => {
    // `onAuthStateChange` fires once immediately with the stored session (or
    // null), then again on every sign-in/sign-out/token refresh — one
    // subscription covers both the initial check and live updates.
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setStatus(nextSession ? 'authenticated' : 'unauthenticated')
    })

    return () => data.subscription.unsubscribe()
  }, [])

  const signInWithPassword = useCallback(async (credentials: SignInWithPasswordCredentials) => {
    const { error } = await supabase.auth.signInWithPassword(credentials)
    return { error }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const updateUser = useCallback(async (attributes: UserAttributes) => {
    const { error } = await supabase.auth.updateUser(attributes)
    return { error }
  }, [])

  const value = useMemo(
    () => ({
      status,
      session,
      user: session?.user ?? null,
      signInWithPassword,
      signOut,
      updateUser,
    }),
    [status, session, signInWithPassword, signOut, updateUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
