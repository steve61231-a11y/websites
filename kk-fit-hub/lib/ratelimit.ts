import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { hashKey } from "./request-info";

/** 5 per hour per IP and per phone number (PRD 13). Stored in Postgres. */
export const PUBLIC_FORM_LIMIT = 5;
export const WINDOW_SECONDS = 3600;

export async function checkRateLimits(
  db: SupabaseClient<Database>,
  form: string,
  keys: { ip: string | null; phone?: string | null },
  limit = PUBLIC_FORM_LIMIT,
): Promise<boolean> {
  const checks: string[] = [];
  if (keys.ip) checks.push(hashKey(`${form}:ip`, keys.ip));
  if (keys.phone) checks.push(hashKey(`${form}:phone`, keys.phone));
  for (const key of checks) {
    const { data, error } = await db.rpc("rate_limit_hit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: WINDOW_SECONDS,
    });
    if (error) {
      console.error("rate limit check failed", error.message);
      return false;
    }
    if (data === false) return false;
  }
  return true;
}
