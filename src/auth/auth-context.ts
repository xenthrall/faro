import { createContext, useContext } from 'react'
import type { AuthError, Session, User } from '@supabase/supabase-js'

/**
 * `loading` until the stored session (if any) has been read once, so
 * consumers can avoid flashing a "signed out" state on page load.
 */
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export type SignInWithPasswordCredentials = {
  email: string
  password: string
}

export type AuthContextValue = {
  status: AuthStatus
  session: Session | null
  user: User | null
  signInWithPassword: (
    credentials: SignInWithPasswordCredentials,
  ) => Promise<{ error: AuthError | null }>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

/** Returns the current auth state. Must be called within an `AuthProvider`. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth() must be used within an <AuthProvider>.')
  }
  return ctx
}
