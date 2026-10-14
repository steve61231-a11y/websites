/** Supabase configuration. The public site falls back to typed seed content
 * when these are not set (before the owner provides credentials). */

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export function hasSupabase(): boolean {
  return supabaseUrl.length > 0 && supabaseAnonKey.length > 0;
}
