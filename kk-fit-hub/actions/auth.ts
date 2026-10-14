"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { hasSupabase } from "@/lib/supabase/env";
import { createSessionClient } from "@/lib/supabase/server";

/**
 * Admin sign-in (PRD 14.4): email and password, then an authenticator code.
 * Two-factor is required for the owner and offered to staff.
 */
export type SignInResult =
  | { ok: true; next: "done" | "mfa" | "enrol" }
  | { ok: false; error: string };

const credentials = z.object({ email: z.email(), password: z.string().min(1).max(200) });
const GENERIC = "That email and password didn't match. Try again.";

async function nextStep(): Promise<"done" | "mfa" | "enrol"> {
  const db = await createSessionClient();
  const { data: aal } = await db.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.nextLevel === "aal2" && aal.currentLevel !== "aal2") return "mfa";
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return "done";
  const { data: profile } = await db.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profile?.role === "owner" && aal?.currentLevel !== "aal2") return "enrol";
  return "done";
}

export async function signIn(input: unknown): Promise<SignInResult> {
  if (!hasSupabase()) return { ok: false, error: "The admin isn't connected to a database yet." };
  const parsed = credentials.safeParse(input);
  if (!parsed.success) return { ok: false, error: GENERIC };
  const db = await createSessionClient();
  const { data, error } = await db.auth.signInWithPassword(parsed.data);
  if (error || !data.user) return { ok: false, error: GENERIC };

  const { data: profile } = await db.from("profiles").select("active").eq("id", data.user.id).maybeSingle();
  if (!profile?.active) {
    await db.auth.signOut();
    return { ok: false, error: "This account doesn't have access to the admin. Ask the owner for an invite." };
  }
  return { ok: true, next: await nextStep() };
}

export type EnrolResult =
  | { ok: true; factorId: string; qr: string; secret: string }
  | { ok: false; error: string };

/** Starts authenticator-app enrolment: returns a QR code and the secret. */
export async function startEnrol(): Promise<EnrolResult> {
  const db = await createSessionClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in again." };
  // Clear any half-finished enrolment first.
  const { data: factors } = await db.auth.mfa.listFactors();
  for (const f of factors?.all ?? []) {
    if (f.status === "unverified") await db.auth.mfa.unenroll({ factorId: f.id });
  }
  const { data, error } = await db.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: `KK Fit Hub ${new Date().toISOString().slice(0, 10)} ${Math.random().toString(36).slice(2, 6)}`,
  });
  if (error || !data) return { ok: false, error: "We couldn't start two-factor set-up. Try again." };
  return { ok: true, factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret };
}

const codeInput = z.object({ factorId: z.string().min(1).max(100).optional(), code: z.string().regex(/^\d{6}$/) });

/** Verifies a code, either to finish enrolment or to complete sign-in. */
export async function verifyCode(input: unknown): Promise<SignInResult> {
  const parsed = codeInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter the 6-digit code from your authenticator app." };
  const db = await createSessionClient();
  let factorId = parsed.data.factorId;
  if (!factorId) {
    const { data } = await db.auth.mfa.listFactors();
    factorId = data?.totp.find((f) => f.status === "verified")?.id;
  }
  if (!factorId) return { ok: false, error: "No authenticator is set up for this account." };
  const { error } = await db.auth.mfa.challengeAndVerify({ factorId, code: parsed.data.code });
  if (error) return { ok: false, error: "That code didn't work. Check the time on your phone and try again." };
  return { ok: true, next: await nextStep() };
}

export async function signOut(): Promise<void> {
  if (hasSupabase()) {
    const db = await createSessionClient();
    await db.auth.signOut();
  }
  redirect("/admin/login");
}

/** Sets the password for an invited staff member (the invite link signs them in first). */
export async function setPassword(input: unknown): Promise<SignInResult> {
  const parsed = z
    .object({ password: z.string().min(10, { error: "Use at least 10 characters." }).max(200) })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Use at least 10 characters." };
  const db = await createSessionClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return { ok: false, error: "This invite link has expired. Ask the owner for a new one." };
  const { error } = await db.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, error: "We couldn't save that password. Try a different one." };
  return { ok: true, next: await nextStep() };
}
