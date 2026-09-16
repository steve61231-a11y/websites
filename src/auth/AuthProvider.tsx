import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured, friendlyError } from '@/lib/supabase'
import type { Profile, Role } from '@/data/types'
import { DEMO_PROFILE } from '@/data/seed'
import { roleCan, type Capability } from './permissions'

type AuthState = {
  ready: boolean
  profile: Profile | null
  isDemo: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<{ needsConfirmation: boolean }>
  sendMagicLink: (email: string) => Promise<void>
  signOut: () => Promise<void>
  /** Demo only — lets someone try the app as a staff member without a second account. */
  setDemoRole: (role: Role) => void
  /** Demo only — one tap past the login screen. */
  enterDemo: () => void
  can: (capability: Capability) => boolean
}

const AuthContext = createContext<AuthState | null>(null)

const DEMO_ROLE_KEY = 'iris-fields:demo:role'
const DEMO_SESSION_KEY = 'iris-fields:demo:signed-in'

const readFlag = (key: string) => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!isSupabaseConfigured)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [demoRole, setDemoRoleState] = useState<Role>(
    () => (readFlag(DEMO_ROLE_KEY) as Role) || 'admin',
  )
  const [demoSignedIn, setDemoSignedIn] = useState(() => readFlag(DEMO_SESSION_KEY) === 'yes')

  /* ---------------------------------------------------------------- demo */

  useEffect(() => {
    if (isSupabaseConfigured) return
    setProfile(demoSignedIn ? { ...DEMO_PROFILE, role: demoRole } : null)
    setReady(true)
  }, [demoRole, demoSignedIn])

  const enterDemo = useCallback(() => {
    try {
      localStorage.setItem(DEMO_SESSION_KEY, 'yes')
    } catch {
      /* the demo still opens, it just will not be remembered */
    }
    setDemoSignedIn(true)
  }, [])

  const setDemoRole = useCallback((role: Role) => {
    setDemoRoleState(role)
    try {
      localStorage.setItem(DEMO_ROLE_KEY, role)
    } catch {
      /* not being able to remember the choice is survivable */
    }
  }, [])

  /* ------------------------------------------------------------ supabase */

  const loadProfile = useCallback(async (session: Session | null) => {
    if (!supabase || !session?.user) {
      setProfile(null)
      return
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()

    if (error || !data) {
      // The profile row is created by a trigger; if it has not landed yet, fall
      // back to the session so the user is not stranded on a blank screen.
      setProfile({
        id: session.user.id,
        fullName: (session.user.user_metadata?.full_name as string) ?? session.user.email ?? 'There',
        email: session.user.email ?? '',
        role: 'staff',
        createdAt: session.user.created_at,
      })
      return
    }
    setProfile({
      id: data.id,
      fullName: data.full_name || session.user.email || 'There',
      email: data.email || session.user.email || '',
      role: data.role,
      createdAt: data.created_at,
    })
  }, [])

  useEffect(() => {
    if (!supabase) return
    let cancelled = false

    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return
      await loadProfile(data.session)
      setReady(true)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      void loadProfile(session)
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [loadProfile])

  const value = useMemo<AuthState>(
    () => ({
      ready,
      profile,
      isDemo: !isSupabaseConfigured,

      async signIn(email, password) {
        if (!supabase) {
          enterDemo()
          return
        }
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) throw new Error(friendlyError(error))
      },

      async signUp(email, password, fullName) {
        if (!supabase) return { needsConfirmation: false }
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { full_name: fullName.trim() } },
        })
        if (error) throw new Error(friendlyError(error))
        return { needsConfirmation: !data.session }
      },

      async sendMagicLink(email) {
        if (!supabase) return
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: { emailRedirectTo: window.location.origin },
        })
        if (error) throw new Error(friendlyError(error))
      },

      async signOut() {
        if (!supabase) {
          try {
            localStorage.removeItem(DEMO_SESSION_KEY)
          } catch {
            /* ignore */
          }
          setDemoSignedIn(false)
          return
        }
        await supabase.auth.signOut()
        setProfile(null)
      },

      setDemoRole,
      enterDemo,
      can: (capability) => roleCan(profile?.role, capability),
    }),
    [ready, profile, setDemoRole, enterDemo],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

/** Shorthand for the very common `can('…')` check inside a component. */
export function useCan(capability: Capability): boolean {
  return useAuth().can(capability)
}
