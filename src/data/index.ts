import { isSupabaseConfigured } from '@/lib/supabase'
import { localRepo } from './localRepo'
import { supabaseRepo } from './supabaseRepo'
import type { Repo } from './repo'

/**
 * One line decides where the school's data lives: real backend when keys are
 * configured, in-browser demo store when they are not.
 */
export const repo: Repo = isSupabaseConfigured ? supabaseRepo : localRepo

export const isDemoMode = repo.mode === 'demo'

export type { Repo }
export { resetDemoData } from './localRepo'
