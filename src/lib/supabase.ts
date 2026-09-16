import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL?.trim()
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

/**
 * The Supabase client, or `null` when no keys are configured.
 *
 * A null client is not an error state — it is how the app decides to run in
 * demo mode, so the system can be opened and shown before a project exists.
 */
export const supabase: SupabaseClient | null =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      })
    : null

export const isSupabaseConfigured = supabase !== null

/** Turns a Supabase/Postgres error into something a non-technical user can act on. */
export function friendlyError(error: unknown): string {
  const raw =
    typeof error === 'string' ? error :
    error instanceof Error ? error.message :
    (error as { message?: string })?.message ?? 'Something went wrong.'

  if (/duplicate key|already exists/i.test(raw)) return 'That already exists.'
  if (/row-level security|permission denied|not authorized/i.test(raw)) {
    return "You don't have permission to do that. Ask an admin for access."
  }
  if (/Invalid login credentials/i.test(raw)) return 'That email and password do not match.'
  if (/Email not confirmed/i.test(raw)) return 'Please confirm your email address first.'
  if (/Failed to fetch|NetworkError|network/i.test(raw)) {
    return 'No connection. Check your internet and try again.'
  }
  if (/violates check constraint/i.test(raw)) return 'Some of those details are not valid.'
  return raw
}
