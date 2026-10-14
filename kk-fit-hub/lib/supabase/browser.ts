"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { supabaseAnonKey, supabaseUrl } from "./env";

/** Browser client for the admin only (sign-in and two-factor). Public forms
 * never use it: they post to server actions. */
export function createAdminBrowserClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
