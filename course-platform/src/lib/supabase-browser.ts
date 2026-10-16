"use client";

import type { SupabaseClient } from "@supabase/supabase-js";

// The browser's connection to Supabase: sign-in with an emailed code (or
// Google). The session lives in this browser; every call to our own /api
// routes carries its access token, and the server checks it.

let client: Promise<SupabaseClient> | null = null;

export function browser(): Promise<SupabaseClient> {
  client ??= import("@supabase/supabase-js").then(({ createClient }) =>
    createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    }),
  );
  return client;
}

/** fetch() to our own API with the student's access token attached. */
export async function authedFetch(path: string, init: RequestInit = {}) {
  const sb = await browser();
  const { data } = await sb.auth.getSession();
  const headers = new Headers(init.headers);
  if (data.session) headers.set("Authorization", `Bearer ${data.session.access_token}`);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  return fetch(path, { ...init, headers });
}
