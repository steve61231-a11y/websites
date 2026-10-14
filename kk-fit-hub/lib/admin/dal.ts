import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";
import type { Database } from "@/lib/supabase/database.types";
import { hasSupabase } from "@/lib/supabase/env";
import { createSessionClient } from "@/lib/supabase/server";

/**
 * Admin data access layer. Every admin page and action resolves the staff
 * member here, from the session, never from client input. Row-level
 * security enforces the same rules again in the database.
 */
export type Staff = {
  db: SupabaseClient<Database>;
  id: string;
  email: string;
  fullName: string;
  firstName: string;
  role: "owner" | "staff";
  isOwner: boolean;
  aal: "aal1" | "aal2";
};

export type StaffResult = { ok: true; staff: Staff } | { ok: false; reason: "signed-out" | "not-staff" | "mfa" | "mfa-enrol" };

/** Resolves the signed-in staff member, without redirecting. */
export const resolveStaff = cache(async (): Promise<StaffResult> => {
  if (!hasSupabase()) return { ok: false, reason: "signed-out" };
  // Session reads are per request; never part of a prerender.
  await connection();
  const db = await createSessionClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return { ok: false, reason: "signed-out" };

  const { data: profile } = await db.from("profiles").select("full_name, role, active").eq("id", user.id).maybeSingle();
  if (!profile || !profile.active) return { ok: false, reason: "not-staff" };

  const { data: aal } = await db.auth.mfa.getAuthenticatorAssuranceLevel();
  const current = (aal?.currentLevel ?? "aal1") as "aal1" | "aal2";
  const nextLevel = aal?.nextLevel ?? "aal1";
  // Anyone with a verified authenticator must complete it.
  if (nextLevel === "aal2" && current !== "aal2") return { ok: false, reason: "mfa" };
  // Two-factor is required for the owner (PRD 14.4).
  if (profile.role === "owner" && current !== "aal2") return { ok: false, reason: "mfa-enrol" };

  return {
    ok: true,
    staff: {
      db,
      id: user.id,
      email: user.email ?? "",
      fullName: profile.full_name,
      firstName: profile.full_name.split(/\s+/)[0] ?? profile.full_name,
      role: profile.role,
      isOwner: profile.role === "owner" && current === "aal2",
      aal: current,
    },
  };
});

/** For pages: redirects to sign-in (or the two-factor step) when needed. */
export async function requireStaff(): Promise<Staff> {
  const r = await resolveStaff();
  if (r.ok) return r.staff;
  if (r.reason === "mfa") redirect("/admin/login?step=mfa");
  if (r.reason === "mfa-enrol") redirect("/admin/login?step=enrol");
  if (r.reason === "not-staff") redirect("/admin/login?error=not-staff");
  redirect("/admin/login");
}

export async function requireOwner(): Promise<Staff> {
  const staff = await requireStaff();
  if (!staff.isOwner) redirect("/admin?error=owner-only");
  return staff;
}

/** For server actions: returns an error instead of redirecting. */
export async function staffOrError(owner = false): Promise<{ staff: Staff } | { error: string }> {
  const r = await resolveStaff();
  if (!r.ok) return { error: "Your session has ended. Please sign in again." };
  if (owner && !r.staff.isOwner) return { error: "Only the owner can do that." };
  return { staff: r.staff };
}

/** The current time for a request-time render (admin pages are never prerendered). */
export async function requestNow(): Promise<number> {
  await connection();
  return Date.now();
}
