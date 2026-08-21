import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000
const EXPIRY_CHECK_INTERVAL_MS = 5 * 60 * 1000

/**
 * True once the session is older than 24h.
 *
 * `last_sign_in_at` is stamped when the user actually logged in and is *not*
 * bumped by token refresh, so it is the honest session age. This mirrors
 * session_is_fresh() in the RLS policies, which is where the limit is really
 * enforced -- this check only exists so an expired user sees the login page
 * instead of an app whose every query mysteriously returns nothing.
 */
function isExpired(session) {
  const signedInAt = Date.parse(session?.user?.last_sign_in_at ?? '')
  if (Number.isNaN(signedInAt)) return false
  return Date.now() - signedInAt > SESSION_MAX_AGE_MS
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // supabase-js persists the session in localStorage and auto-refreshes it, so a
  // page reload keeps you signed in.
  useEffect(() => {
    let active = true

    const apply = (next) => {
      if (!active) return
      if (next && isExpired(next)) {
        supabase.auth.signOut()
        setSession(null)
      } else {
        setSession(next)
      }
      setLoading(false)
    }

    supabase.auth.getSession().then(({ data }) => apply(data.session))

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => apply(next))

    // Catches a tab left open past the 24h mark.
    const timer = setInterval(() => {
      setSession(current => {
        if (current && isExpired(current)) {
          supabase.auth.signOut()
          return null
        }
        return current
      })
    }, EXPIRY_CHECK_INTERVAL_MS)

    return () => {
      active = false
      sub.subscription.unsubscribe()
      clearInterval(timer)
    }
  }, [])

  const signInWithGoogle = useCallback(async () => {
    setError('')
    // Default PKCE flow. detectSessionInUrl (on by default) exchanges the
    // returned ?code= and cleans the URL, so no callback route is needed -- which
    // matters, because this app has no router.
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (err) setError(err.message)
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setSession(null)
  }, [])

  const user = session?.user ?? null

  return (
    <AuthContext.Provider value={{
      user,
      email: user?.email?.toLowerCase() ?? null,
      loading,
      error,
      signInWithGoogle,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
