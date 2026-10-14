"use server";

import { updateTag } from "next/cache";
import { z } from "zod";
import { staffOrError } from "@/lib/admin/dal";
import { tags } from "@/lib/data/public";
import { normaliseKenyanPhone } from "@/lib/phone";
import { siteUrl } from "@/lib/seo";
import { createServiceClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Admin actions (PRD 15). Each resolves the staff member from the session and
 * writes with their own session client, so row-level security and the
 * database triggers (approval guard, audit log) apply. The service role is
 * used only where Supabase requires it (storage, inviting users), after an
 * explicit owner check.
 */
export type AdminResult = { ok: true; data?: Record<string, string> } | { ok: false; error: string };

const id = z.uuid();
const optionalText = (max: number) => z.string().trim().max(max).optional().transform((v) => (v ? v : null));
const dbError = (error: { message: string; code?: string } | null): AdminResult | null => {
  if (!error) return null;
  if (error.code === "42501") return { ok: false, error: error.message.includes("owner") ? error.message : "You don't have permission to do that." };
  if (error.message.includes("inquiries_lost_reason")) return { ok: false, error: "Add a reason before marking this lost." };
  return { ok: false, error: error.message };
};

// ---------------------------------------------------------------------------
// Inquiries
// ---------------------------------------------------------------------------
const inquiryPatch = z.object({
  id,
  status: z.enum(["new", "contacted", "demo_scheduled", "proposal_sent", "won", "lost", "closed"]).optional(),
  lost_reason: optionalText(500),
  next_action: optionalText(300),
  next_action_due: z.union([z.iso.date(), z.literal("")]).optional().transform((v) => (v ? v : null)),
  assigned_to: z.union([id, z.literal("")]).optional().transform((v) => (v ? v : null)),
});

export async function updateInquiry(input: unknown): Promise<AdminResult> {
  const auth = await staffOrError();
  if ("error" in auth) return { ok: false, error: auth.error };
  const parsed = inquiryPatch.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the values and try again." };
  const raw = input as Record<string, unknown>;
  const { id: inquiryId, ...values } = parsed.data;
  // Only send the fields the caller included.
  const patch: Database["public"]["Tables"]["inquiries"]["Update"] = {};
  if ("status" in raw) patch.status = values.status;
  if ("lost_reason" in raw) patch.lost_reason = values.lost_reason;
  if ("next_action" in raw) patch.next_action = values.next_action;
  if ("next_action_due" in raw) patch.next_action_due = values.next_action_due;
  if ("assigned_to" in raw) patch.assigned_to = values.assigned_to;
  if (patch.status && patch.status !== "lost" && !("lost_reason" in raw)) patch.lost_reason = null;
  const { error } = await auth.staff.db.from("inquiries").update(patch).eq("id", inquiryId);
  return dbError(error) ?? { ok: true };
}

// ---------------------------------------------------------------------------
// Notes
// ---------------------------------------------------------------------------
export async function addNote(input: unknown): Promise<AdminResult> {
  const auth = await staffOrError();
  if ("error" in auth) return { ok: false, error: auth.error };
  const parsed = z
    .object({ entityType: z.enum(["inquiry", "application"]), entityId: id, body: z.string().trim().min(1).max(5000) })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Write a note first." };
  const { data, error } = await auth.staff.db
    .from("notes")
    .insert({ entity_type: parsed.data.entityType, entity_id: parsed.data.entityId, body: parsed.data.body, author_id: auth.staff.id })
    .select("id")
    .single();
  return dbError(error) ?? { ok: true, data: { id: data!.id } };
}

export async function deleteNote(input: unknown): Promise<AdminResult> {
  const auth = await staffOrError(true);
  if ("error" in auth) return { ok: false, error: auth.error };
  const parsed = id.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Unknown note." };
  const { error } = await auth.staff.db.from("notes").delete().eq("id", parsed.data);
  return dbError(error) ?? { ok: true };
}

// ---------------------------------------------------------------------------
// Applications and vetting
// ---------------------------------------------------------------------------
export async function updateApplicationStatus(input: unknown): Promise<AdminResult> {
  const auth = await staffOrError();
  if ("error" in auth) return { ok: false, error: auth.error };
  const parsed = z
    .object({
      id,
      status: z.enum(["new", "shortlisted", "in_vetting", "approved", "on_hold", "declined"]),
      decline_reason: optionalText(500),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the values and try again." };
  const { id: appId, status, decline_reason } = parsed.data;
  if ((status === "approved" || status === "declined") && !auth.staff.isOwner) {
    return { ok: false, error: "Only the owner can approve or decline an application." };
  }
  const { error } = await auth.staff.db
    .from("applications")
    .update({ status, ...(status === "declined" ? { decline_reason } : {}) })
    .eq("id", appId);
  return dbError(error) ?? { ok: true };
}

export async function recordCheck(input: unknown): Promise<AdminResult> {
  const auth = await staffOrError();
  if ("error" in auth) return { ok: false, error: auth.error };
  const parsed = z
    .object({
      applicationId: id,
      checkType: z.enum(["interview", "live_demo", "good_conduct", "references", "first_aid"]),
      result: z.enum(["pending", "passed", "failed", "waived"]),
      note: optionalText(1000),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Please check the values and try again." };
  const { applicationId, checkType, result, note } = parsed.data;
  if (result === "waived" && (!auth.staff.isOwner || !note)) {
    return { ok: false, error: "Only the owner can waive a check, and a note is required." };
  }
  const { error } = await auth.staff.db
    .from("vetting_checks")
    .update({ result, note })
    .eq("application_id", applicationId)
    .eq("check_type", checkType);
  return dbError(error) ?? { ok: true };
}

// ---------------------------------------------------------------------------
// Owner-only: delete a person (data-subject request, PRD 14.5)
// ---------------------------------------------------------------------------
export async function deletePerson(input: unknown): Promise<AdminResult> {
  const auth = await staffOrError(true);
  if ("error" in auth) return { ok: false, error: auth.error };
  const parsed = z.object({ kind: z.enum(["inquiry", "application"]), id }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Unknown record." };
  const { kind, id: recordId } = parsed.data;
  const db = auth.staff.db;
  if (kind === "application") {
    const { data: files } = await db.from("application_files").select("storage_path").eq("application_id", recordId);
    const paths = (files ?? []).map((f) => f.storage_path);
    if (paths.length > 0) {
      const { error } = await createServiceClient().storage.from("applicant-files").remove(paths);
      if (error) return { ok: false, error: "Couldn't delete the documents. Nothing was removed." };
    }
    const { error } = await db.from("applications").delete().eq("id", recordId);
    if (error) return dbError(error)!;
  } else {
    const { error } = await db.from("inquiries").delete().eq("id", recordId);
    if (error) return dbError(error)!;
  }
  await db.from("notes").delete().eq("entity_type", kind).eq("entity_id", recordId);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Open roles
// ---------------------------------------------------------------------------
const roleSchema = z.object({
  id: z.union([id, z.literal("")]).optional(),
  title: z.string().trim().min(2).max(120),
  activity_id: z.union([id, z.literal("")]).optional().transform((v) => (v ? v : null)),
  counties: z.array(z.string().trim().max(60)).max(47).default([]),
  employment_type: optionalText(60),
  description: optionalText(1000),
  is_open: z.boolean(),
  sort_order: z.coerce.number().int().min(0).max(999).default(0),
});

export async function saveRole(input: unknown): Promise<AdminResult> {
  const auth = await staffOrError();
  if ("error" in auth) return { ok: false, error: auth.error };
  const parsed = roleSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Add a title (at least 2 characters)." };
  const { id: roleId, ...row } = parsed.data;
  const q = roleId
    ? auth.staff.db.from("open_roles").update(row).eq("id", roleId)
    : auth.staff.db.from("open_roles").insert(row);
  const { error } = await q;
  if (error) return dbError(error)!;
  updateTag(tags.roles);
  return { ok: true };
}

export async function deleteRole(input: unknown): Promise<AdminResult> {
  const auth = await staffOrError(true);
  if ("error" in auth) return { ok: false, error: auth.error };
  const parsed = id.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Unknown role." };
  const { error } = await auth.staff.db.from("open_roles").delete().eq("id", parsed.data);
  if (error) return dbError(error)!;
  updateTag(tags.roles);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Activities (owner). Saving refreshes the public pages.
// ---------------------------------------------------------------------------
const activitySchema = z.object({
  id,
  name: z.string().trim().min(2).max(60),
  one_liner: z.string().trim().min(2).max(160),
  description: optionalText(2000),
  outcomes: z.array(z.string().trim().min(1).max(80)).max(8),
  age_range: optionalText(80),
  status: z.enum(["available", "soon", "hidden"]),
  recruiting: z.boolean(),
  sort_order: z.coerce.number().int().min(0).max(999),
});

export async function saveActivity(input: unknown): Promise<AdminResult> {
  const auth = await staffOrError(true);
  if ("error" in auth) return { ok: false, error: auth.error };
  const parsed = activitySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the values." };
  const { id: activityId, ...row } = parsed.data;
  const { error } = await auth.staff.db.from("activities").update(row).eq("id", activityId);
  if (error) return dbError(error)!;
  updateTag(tags.activities);
  updateTag(tags.roles);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Testimonials and partners (owner)
// ---------------------------------------------------------------------------
const permissionError = "Tick “I have written permission to publish this” before publishing.";

export async function saveTestimonial(input: unknown): Promise<AdminResult> {
  const auth = await staffOrError(true);
  if ("error" in auth) return { ok: false, error: auth.error };
  const parsed = z
    .object({
      id: z.union([id, z.literal("")]).optional(),
      quote: z.string().trim().min(5).max(800),
      author_name: z.string().trim().min(2).max(80),
      author_role: optionalText(80),
      organisation: optionalText(120),
      permission_confirmed: z.boolean(),
      published: z.boolean(),
      sort_order: z.coerce.number().int().min(0).max(999).default(0),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Add the quote and the person's name." };
  const { id: rowId, ...row } = parsed.data;
  if (row.published && !row.permission_confirmed) return { ok: false, error: permissionError };
  const { error } = rowId
    ? await auth.staff.db.from("testimonials").update(row).eq("id", rowId)
    : await auth.staff.db.from("testimonials").insert(row);
  if (error) return dbError(error)!;
  updateTag(tags.testimonials);
  return { ok: true };
}

export async function savePartner(input: unknown): Promise<AdminResult> {
  const auth = await staffOrError(true);
  if ("error" in auth) return { ok: false, error: auth.error };
  const parsed = z
    .object({
      id: z.union([id, z.literal("")]).optional(),
      name: z.string().trim().min(2).max(120),
      url: z.union([z.url({ protocol: /^https?$/ }), z.literal("")]).optional().transform((v) => (v ? v : null)),
      permission_confirmed: z.boolean(),
      published: z.boolean(),
      sort_order: z.coerce.number().int().min(0).max(999).default(0),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Add the partner's name (and a full https:// link, if any)." };
  const { id: rowId, ...row } = parsed.data;
  if (row.published && !row.permission_confirmed) return { ok: false, error: permissionError };
  const { error } = rowId
    ? await auth.staff.db.from("partners").update(row).eq("id", rowId)
    : await auth.staff.db.from("partners").insert(row);
  if (error) return dbError(error)!;
  updateTag(tags.partners);
  return { ok: true };
}

export async function deleteContent(input: unknown): Promise<AdminResult> {
  const auth = await staffOrError(true);
  if ("error" in auth) return { ok: false, error: auth.error };
  const parsed = z.object({ kind: z.enum(["testimonials", "partners"]), id }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Unknown item." };
  const { error } = await auth.staff.db.from(parsed.data.kind).delete().eq("id", parsed.data.id);
  if (error) return dbError(error)!;
  updateTag(parsed.data.kind === "testimonials" ? tags.testimonials : tags.partners);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Settings (owner)
// ---------------------------------------------------------------------------
const phoneList = z
  .array(z.string())
  .transform((list) => list.map((p) => normaliseKenyanPhone(p)).filter((p): p is string => Boolean(p)));

export async function saveSettings(input: unknown): Promise<AdminResult> {
  const auth = await staffOrError(true);
  if ("error" in auth) return { ok: false, error: auth.error };
  const parsed = z
    .object({
      phones: phoneList.refine((l) => l.length > 0, { error: "Add at least one valid phone number." }),
      whatsapp_e164: z.string().transform((v, ctx) => {
        const n = normaliseKenyanPhone(v);
        if (!n) ctx.addIssue({ code: "custom", message: "Enter a valid WhatsApp number." });
        return n ?? "";
      }),
      email: z.union([z.email(), z.literal("")]).transform((v) => (v ? v : null)),
      socials: z.record(z.string().max(40), z.union([z.url({ protocol: /^https$/ }), z.literal("")])),
      counties: z.array(z.string().trim().min(2).max(60)).min(1, { error: "Add at least one county." }).max(47),
      response_time_text: z.string().trim().min(2).max(60),
      start_term_options: z.array(z.string().trim().min(1).max(60)).max(12),
      required_checks: z.array(z.enum(["interview", "live_demo", "good_conduct", "references", "first_aid"])),
      email_alerts_enabled: z.boolean(),
      alert_recipients: z.array(z.email({ error: "Each alert recipient must be a valid email address." })).max(10),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the settings." };
  const socials = Object.fromEntries(Object.entries(parsed.data.socials).filter(([, v]) => v));
  const { error } = await auth.staff.db
    .from("site_settings")
    .update({ ...parsed.data, socials })
    .eq("singleton", true);
  if (error) return dbError(error)!;
  updateTag(tags.settings);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Team (owner)
// ---------------------------------------------------------------------------
export async function inviteStaff(input: unknown): Promise<AdminResult> {
  const auth = await staffOrError(true);
  if ("error" in auth) return { ok: false, error: auth.error };
  const parsed = z
    .object({ email: z.email(), fullName: z.string().trim().min(2).max(80), role: z.enum(["owner", "staff"]) })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter a name and a valid email address." };
  const admin = createServiceClient();
  const { data, error } = await admin.auth.admin.generateLink({
    type: "invite",
    email: parsed.data.email,
    options: { redirectTo: `${siteUrl}/admin/accept`, data: { full_name: parsed.data.fullName } },
  });
  if (error || !data.user) {
    return { ok: false, error: error?.message.includes("already") ? "That email already has an account." : "We couldn't create the invite." };
  }
  const { error: profileError } = await auth.staff.db.from("profiles").insert({
    id: data.user.id,
    full_name: parsed.data.fullName,
    email: parsed.data.email,
    role: parsed.data.role,
  });
  if (profileError) return dbError(profileError)!;
  return { ok: true, data: { link: data.properties.action_link } };
}

export async function updateMember(input: unknown): Promise<AdminResult> {
  const auth = await staffOrError(true);
  if ("error" in auth) return { ok: false, error: auth.error };
  const parsed = z
    .object({ id, role: z.enum(["owner", "staff"]).optional(), active: z.boolean().optional() })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Unknown team member." };
  if (parsed.data.id === auth.staff.id) return { ok: false, error: "You can't change your own role or access." };
  const { id: memberId, ...patch } = parsed.data;
  const { error } = await auth.staff.db.from("profiles").update(patch).eq("id", memberId);
  if (error) return dbError(error)!;
  if (patch.active !== undefined) {
    // Deactivated staff are also signed out everywhere.
    await createServiceClient().auth.admin.updateUserById(memberId, {
      ban_duration: patch.active ? "none" : "876000h",
    });
  }
  return { ok: true };
}
