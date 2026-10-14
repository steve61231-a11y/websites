"use server";

import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { z } from "zod";
import { PRIVACY_VERSION } from "@/content/legal";
import { sendAlert } from "@/lib/email";
import { normaliseKenyanPhone } from "@/lib/phone";
import { checkRateLimits } from "@/lib/ratelimit";
import { clientIp } from "@/lib/request-info";
import { createServiceClient, hasServiceRole } from "@/lib/supabase/admin";
import { verifyTurnstile } from "@/lib/turnstile";
import { type ActionResult, messages, otherValue } from "@/lib/validation/common";
import { contactPayload } from "@/lib/validation/contact";
import { detailsPayload, requestPayload } from "@/lib/validation/request";
import {
  applicationPayload,
  allowedMimes,
  isAllowedFile,
  MAX_FILE_BYTES,
  uploadRequest,
  type UploadedFile,
} from "@/lib/validation/application";

/**
 * Public form actions (PRD 13, "Request path for a public form"). The
 * browser never writes to the database: each action validates, rejects a
 * filled honeypot silently, verifies Turnstile, applies rate limits, then
 * writes with the service role. Only the new reference is returned.
 */

const BUCKET = "applicant-files";
const rpcResult = z.object({ id: z.uuid(), ref: z.string(), duplicate: z.boolean() });

function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    // Drop the wrapper ("fields", "step1" …) so keys match form field names.
    const path = issue.path.filter((p) => p !== "fields").join(".");
    if (!out[path]) out[path] = issue.message;
  }
  return out;
}

function invalid(error: z.ZodError): ActionResult {
  return { ok: false, error: "Please check the highlighted fields.", fieldErrors: fieldErrors(error) };
}

/** A believable success for bots that fill the honeypot. Nothing is stored. */
function silentReject(prefix: "KK" | "KKC"): ActionResult {
  return { ok: true, ref: prefix === "KK" ? "KK-1000" : "KKC-0100" };
}

async function guard(
  form: string,
  meta: { website?: string; turnstileToken?: string },
  phone: string | null,
): Promise<ActionResult | null> {
  if (!hasServiceRole()) return { ok: false, error: messages.network };
  const ip = await clientIp();
  if (!(await verifyTurnstile(meta.turnstileToken, ip))) return { ok: false, error: messages.botCheck };
  const db = createServiceClient();
  if (!(await checkRateLimits(db, form, { ip, phone }))) return { ok: false, error: messages.rateLimited };
  return null;
}

// ---------------------------------------------------------------------------
// Demonstration request and register interest (PRD 8.1)
// ---------------------------------------------------------------------------
export async function submitInquiry(input: unknown): Promise<ActionResult> {
  const parsed = requestPayload.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { fields, meta, type } = parsed.data;
  if (meta.website) return silentReject("KK");

  const phone = normaliseKenyanPhone(fields.phone);
  const blocked = await guard(type === "interest" ? "interest" : "request", meta, phone);
  if (blocked) return blocked;

  const db = createServiceClient();
  const { data, error } = await db.rpc("submit_inquiry", {
    p: {
      type,
      contact_name: fields.name,
      contact_role: fields.role === otherValue ? `Other: ${fields.roleOther ?? ""}` : fields.role,
      school_name: fields.school,
      county: fields.county === otherValue ? otherValue : fields.county,
      county_other: fields.county === otherValue ? (fields.countyOther ?? null) : null,
      phone_e164: phone,
      email: fields.email || null,
      source: meta.source ?? null,
      utm: meta.utm ?? {},
      consent_version: PRIVACY_VERSION,
      idempotency_key: meta.idempotencyKey,
      activities: fields.activities,
    },
  });
  const result = rpcResult.safeParse(data);
  if (error || !result.success) {
    console.error("submit_inquiry failed", error?.message);
    return { ok: false, error: messages.network };
  }

  if (!result.data.duplicate) {
    after(() =>
      sendAlert({
        kind: "inquiry",
        id: result.data.id,
        ref: result.data.ref,
        title: type === "interest" ? "New register-interest" : "New demonstration request",
        lines: [
          ["School", fields.school],
          ["Name", `${fields.name} (${fields.role === otherValue ? fields.roleOther : fields.role})`],
          ["County", fields.county === otherValue ? fields.countyOther : fields.county],
          ["Phone", phone],
          ["Activities", fields.activities.join(", ")],
          ["Source", meta.source],
        ],
      }),
    );
  }
  return { ok: true, ref: result.data.ref };
}

/** Step 2 of a request, offered on the success screen. */
export async function addInquiryDetails(input: unknown): Promise<ActionResult> {
  const parsed = detailsPayload.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  if (!hasServiceRole()) return { ok: false, error: messages.network };
  const { ref, idempotencyKey, fields } = parsed.data;

  const db = createServiceClient();
  const { data, error } = await db.rpc("add_inquiry_details", {
    p_ref: ref,
    p_key: idempotencyKey,
    p: {
      institution_type: fields.institutionType ?? null,
      sector: fields.sector ?? null,
      learners_band: fields.learnersBand ?? null,
      grades: fields.grades ?? [],
      preferred_days: fields.preferredDays ?? [],
      preferred_time: fields.preferredTime ?? null,
      start_term: fields.startTerm ?? null,
      contact_pref: fields.contactPref ?? null,
      message: fields.message ?? null,
    },
  });
  if (error || data !== true) {
    console.error("add_inquiry_details failed", error?.message);
    return { ok: false, error: messages.network };
  }
  return { ok: true, ref };
}

// ---------------------------------------------------------------------------
// Contact (PRD 8.3)
// ---------------------------------------------------------------------------
export async function sendContact(input: unknown): Promise<ActionResult> {
  const parsed = contactPayload.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { fields, meta } = parsed.data;
  if (meta.website) return silentReject("KK");

  const phone = normaliseKenyanPhone(fields.phone);
  const blocked = await guard("contact", meta, phone);
  if (blocked) return blocked;

  const db = createServiceClient();
  const { data, error } = await db.rpc("submit_inquiry", {
    p: {
      type: "general",
      contact_name: fields.name,
      contact_role: fields.kind,
      phone_e164: phone,
      email: fields.email || null,
      message: fields.message,
      source: meta.source ?? null,
      utm: meta.utm ?? {},
      consent_version: PRIVACY_VERSION,
      idempotency_key: meta.idempotencyKey,
      activities: [],
    },
  });
  const result = rpcResult.safeParse(data);
  if (error || !result.success) {
    console.error("contact submit failed", error?.message);
    return { ok: false, error: messages.network };
  }
  if (!result.data.duplicate) {
    after(() =>
      sendAlert({
        kind: "inquiry",
        id: result.data.id,
        ref: result.data.ref,
        title: "New message",
        lines: [
          ["Name", `${fields.name} (${fields.kind})`],
          ["Phone", phone],
          ["Message", fields.message.slice(0, 300)],
        ],
      }),
    );
  }
  return { ok: true, ref: result.data.ref };
}

// ---------------------------------------------------------------------------
// Coach application uploads (PRD 8.2, 14.3)
// ---------------------------------------------------------------------------
export type UploadUrlResult =
  | { ok: true; path: string; signedUrl: string }
  | { ok: false; error: string };

/** Issues a short-lived signed upload URL under pending/{draftId}/ with a random name. */
export async function createUploadUrl(input: unknown): Promise<UploadUrlResult> {
  const parsed = uploadRequest.safeParse(input);
  if (!parsed.success) return { ok: false, error: messages.file };
  const { draftId, name, mime, size, turnstileToken } = parsed.data;
  if (!isAllowedFile(name, mime, size)) return { ok: false, error: messages.file };
  if (!hasServiceRole()) return { ok: false, error: messages.network };

  const ip = await clientIp();
  if (!(await verifyTurnstile(turnstileToken, ip))) return { ok: false, error: messages.botCheck };
  const db = createServiceClient();
  // Uploads are cheaper than submissions; allow a full application's worth per hour.
  if (!(await checkRateLimits(db, "upload", { ip }, 30))) return { ok: false, error: messages.rateLimited };

  const ext = (name.toLowerCase().match(/\.(pdf|jpe?g|png|heic|heif)$/)?.[1] ?? "pdf").replace("jpeg", "jpg");
  const path = `pending/${draftId}/${randomUUID()}.${ext}`;
  const { data, error } = await db.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error || !data) {
    console.error("createSignedUploadUrl failed", error?.message);
    return { ok: false, error: messages.network };
  }
  return { ok: true, path, signedUrl: data.signedUrl };
}

// ---------------------------------------------------------------------------
// Coach application (PRD 8.2)
// ---------------------------------------------------------------------------
export async function submitApplication(input: unknown): Promise<ActionResult> {
  const parsed = applicationPayload.safeParse(input);
  if (!parsed.success) return invalid(parsed.error);
  const { fields, draftId, openRoleId, meta } = parsed.data;
  if (meta.website) return silentReject("KKC");

  const phone = normaliseKenyanPhone(fields.step1.phone);
  const blocked = await guard("apply", meta, phone);
  if (blocked) return blocked;
  const db = createServiceClient();

  // A double submit returns the first reference without touching files again.
  const existing = await db
    .from("applications")
    .select("ref")
    .eq("idempotency_key", meta.idempotencyKey)
    .maybeSingle();
  if (existing.data) return { ok: true, ref: existing.data.ref };

  // Check every attached file exists in this draft's folder, with its real size and type.
  const wanted: { file: UploadedFile; kind: "certificate" | "first_aid" }[] = [
    ...fields.step3.certificates.map((file) => ({ file, kind: "certificate" as const })),
    ...(fields.step3.firstAid === "current" && fields.step3.firstAidFile
      ? [{ file: fields.step3.firstAidFile, kind: "first_aid" as const }]
      : []),
  ];
  const stored = new Map<string, { size: number; mimetype: string }>();
  if (wanted.length > 0) {
    const { data: listing, error } = await db.storage.from(BUCKET).list(`pending/${draftId}`, { limit: 100 });
    if (error) {
      console.error("list uploads failed", error.message);
      return { ok: false, error: messages.network };
    }
    for (const obj of listing ?? []) {
      const m = obj.metadata as { size?: number; mimetype?: string } | null;
      if (m?.size !== undefined) stored.set(`pending/${draftId}/${obj.name}`, { size: m.size, mimetype: m.mimetype ?? "" });
    }
  }
  for (const { file } of wanted) {
    const info = stored.get(file.path);
    if (!file.path.startsWith(`pending/${draftId}/`) || !info || info.size > MAX_FILE_BYTES) {
      return { ok: false, error: messages.file, fieldErrors: { "step3.certificates": messages.file } };
    }
    const mime = (allowedMimes as readonly string[]).includes(info.mimetype) ? info.mimetype : file.mime;
    if (!isAllowedFile(file.path, mime, info.size)) {
      return { ok: false, error: messages.file, fieldErrors: { "step3.certificates": messages.file } };
    }
  }

  // Move files out of pending/ into the application's folder.
  const applicationId = randomUUID();
  const files: { kind: string; storage_path: string; original_name: string; mime: string; size_bytes: number }[] = [];
  for (const { file, kind } of wanted) {
    const dest = `applications/${applicationId}/${file.path.split("/").pop()}`;
    const { error } = await db.storage.from(BUCKET).move(file.path, dest);
    if (error) {
      console.error("move upload failed", error.message);
      return { ok: false, error: messages.network };
    }
    const info = stored.get(file.path)!;
    files.push({
      kind,
      storage_path: dest,
      original_name: file.name.slice(0, 200),
      mime: info.mimetype || file.mime,
      size_bytes: info.size,
    });
  }

  const s1 = fields.step1;
  const s2 = fields.step2;
  const s3 = fields.step3;
  const s4 = fields.step4;
  const { data, error } = await db.rpc("submit_application", {
    p: {
      id: applicationId,
      idempotency_key: meta.idempotencyKey,
      full_name: s1.fullName,
      phone_e164: phone,
      email: s1.email,
      county: s1.county,
      is_adult: s1.isAdult,
      heard_from: s1.heardFrom ?? null,
      main_activity: s2.mainActivity === otherValue ? null : s2.mainActivity,
      main_activity_other: s2.mainActivity === otherValue ? (s2.mainActivityOther ?? null) : null,
      other_activities: (s2.otherActivities ?? []).filter((a) => a !== s2.mainActivity),
      years_practising: s2.yearsPractising,
      years_coaching: s2.yearsCoaching,
      highest_rank: s2.highestRank,
      experience: s2.experience,
      video_url: s3.videoUrl || null,
      first_aid: s3.firstAid,
      good_conduct: s3.goodConduct,
      referees: s3.referees
        .filter((r) => r.name && r.phone)
        .map((r) => ({ name: r.name, phone_e164: normaliseKenyanPhone(r.phone), relationship: r.relationship })),
      files,
      availability: s4.availability,
      work_preference: s4.workPreference,
      counties: s4.counties,
      extra_notes: s4.extraNotes ?? null,
      open_role_id: openRoleId ?? null,
      consent_version: PRIVACY_VERSION,
      source: meta.source ?? null,
      utm: meta.utm ?? {},
    },
  });
  const result = rpcResult.safeParse(data);
  if (error || !result.success) {
    console.error("submit_application failed", error?.message);
    return { ok: false, error: messages.network };
  }

  if (!result.data.duplicate) {
    after(() =>
      sendAlert({
        kind: "application",
        id: result.data.id,
        ref: result.data.ref,
        title: "New coach application",
        lines: [
          ["Name", s1.fullName],
          ["Discipline", s2.mainActivity === otherValue ? s2.mainActivityOther : s2.mainActivity],
          ["Experience", `${s2.yearsPractising} years practising, ${s2.yearsCoaching} coaching`],
          ["Rank", s2.highestRank],
          ["County", s1.county],
          ["Documents", `${files.length} attached`],
        ],
      }),
    );
  }
  return { ok: true, ref: result.data.ref };
}
