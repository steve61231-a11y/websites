import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./env.ts";

// Everything the server reads and writes, behind one small interface so the
// payment and progress logic can be tested without a database. The Supabase
// implementation at the bottom uses the service role: it bypasses row-level
// security, so every caller must have already checked who is asking.

export type PaymentKind = "course" | "session";
export type PaymentStatus = "pending" | "success" | "failed" | "abandoned" | "refunded";

export type PaymentRow = {
  id: string;
  seq: number;
  reference: string;
  kind: PaymentKind;
  item: string; // course slug, or session topic id
  email: string;
  name: string;
  amount: number; // whole KES
  currency: string;
  status: PaymentStatus;
  paystack_id: string | null;
  channel: string | null;
  paid_at: string | null;
  user_id: string | null;
  meta: Record<string, unknown>;
  fulfilled_at: string | null;
  created_at: string;
};

export type NewPayment = Pick<PaymentRow, "reference" | "kind" | "item" | "email" | "name" | "amount" | "currency" | "meta">;

export type LessonRow = { lesson_code: string; position_seconds: number; completed_at: string | null };
export type AttemptRow = { quiz_key: string; answers: Record<string, string>; score: number; total: number; passed: boolean; attempted_at: string };
export type CertificateRow = { number: string; course_slug: string; full_name: string; issued_at: string };

export interface Store {
  insertPayment(p: NewPayment): Promise<void>;
  getPayment(reference: string): Promise<PaymentRow | null>;
  markSuccess(reference: string, info: { paystackId: string; channel: string; paidAt: string }): Promise<void>;
  setStatus(reference: string, status: PaymentStatus): Promise<void>;
  /** Takes the one-time right to fulfil this paid order, or null if someone else has it or it's done. */
  claim(reference: string): Promise<PaymentRow | null>;
  markFulfilled(reference: string, userId: string | null): Promise<void>;
  /** The account for this email, created if it doesn't exist yet. */
  ensureUser(email: string, name: string): Promise<string>;
  grantEnrollment(userId: string, courseSlug: string, paymentId: string): Promise<void>;
  createBooking(b: { paymentId: string; userId: string | null; topic: string; name: string; email: string; phone: string; notes: string }): Promise<void>;

  // learning
  profile(userId: string): Promise<{ full_name: string; email: string; watermark_id: number } | null>;
  enrolledCourses(userId: string): Promise<string[]>;
  lessonRows(userId: string, courseSlug: string): Promise<LessonRow[]>;
  attemptRows(userId: string, courseSlug: string): Promise<AttemptRow[]>;
  certificateRows(userId: string): Promise<CertificateRow[]>;
  completeLesson(userId: string, courseSlug: string, lessonCode: string): Promise<void>;
  savePosition(userId: string, courseSlug: string, lessonCode: string, seconds: number): Promise<void>;
  insertAttempt(userId: string, courseSlug: string, a: Omit<AttemptRow, "attempted_at">): Promise<AttemptRow>;
  issueCertificate(userId: string, courseSlug: string, courseCode: string, fullName: string): Promise<CertificateRow>;
  certificateByNumber(number: string): Promise<CertificateRow | null>;
}

let client: SupabaseClient | null = null;
/** The service-role client. Server only. */
export function admin(): SupabaseClient {
  if (!client) {
    const url = env.supabaseUrl();
    const key = env.supabaseServiceKey();
    if (!url || !key) throw new Error("Backend not configured: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  }
  return client;
}

/** Who is calling? Reads "Authorization: Bearer <access token>" and checks it with Supabase. */
export async function userFromRequest(request: Request): Promise<{ id: string; email: string } | null> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;
  const { data, error } = await admin().auth.getUser(token);
  if (error || !data.user?.email) return null;
  return { id: data.user.id, email: data.user.email.toLowerCase() };
}

function must<T>(r: { data: T; error: { message: string } | null }, what: string): T {
  if (r.error) throw new Error(`${what}: ${r.error.message}`);
  return r.data;
}

export function supabaseStore(): Store {
  const db = admin();
  return {
    async insertPayment(p) {
      must(await db.from("payments").insert(p), "insert payment");
    },
    async getPayment(reference) {
      return must(await db.from("payments").select("*").eq("reference", reference).maybeSingle(), "get payment") as PaymentRow | null;
    },
    async markSuccess(reference, info) {
      must(
        await db.from("payments").update({ status: "success", paystack_id: info.paystackId, channel: info.channel, paid_at: info.paidAt }).eq("reference", reference).neq("status", "success"),
        "mark success",
      );
    },
    async setStatus(reference, status) {
      must(await db.from("payments").update({ status }).eq("reference", reference).neq("status", "success"), "set status");
    },
    async claim(reference) {
      const rows = must(await db.rpc("claim_fulfillment", { p_reference: reference }), "claim") as PaymentRow[] | null;
      return rows && rows.length ? rows[0] : null;
    },
    async markFulfilled(reference, userId) {
      must(await db.from("payments").update({ fulfilled_at: new Date().toISOString(), user_id: userId }).eq("reference", reference), "mark fulfilled");
    },
    async ensureUser(email, name) {
      const lookup = async () => must(await db.rpc("user_id_by_email", { p_email: email }), "find user") as string | null;
      const found = await lookup();
      if (found) return found;
      const { data, error } = await db.auth.admin.createUser({ email, email_confirm: true, user_metadata: { full_name: name } });
      if (data?.user) return data.user.id;
      const again = await lookup(); // lost a race with a parallel request
      if (again) return again;
      throw new Error(`create user: ${error?.message ?? "unknown error"}`);
    },
    async grantEnrollment(userId, courseSlug, paymentId) {
      must(
        await db.from("enrollments").upsert({ user_id: userId, course_slug: courseSlug, payment_id: paymentId, status: "active" }, { onConflict: "user_id,course_slug" }),
        "grant enrollment",
      );
    },
    async createBooking(b) {
      must(
        await db.from("bookings").upsert(
          { payment_id: b.paymentId, user_id: b.userId, topic: b.topic, name: b.name, email: b.email, phone: b.phone, notes: b.notes },
          { onConflict: "payment_id", ignoreDuplicates: true },
        ),
        "create booking",
      );
    },

    async profile(userId) {
      return must(await db.from("profiles").select("full_name,email,watermark_id").eq("id", userId).maybeSingle(), "profile");
    },
    async enrolledCourses(userId) {
      const rows = must(await db.from("enrollments").select("course_slug").eq("user_id", userId).eq("status", "active"), "enrollments") as { course_slug: string }[];
      return rows.map((r) => r.course_slug);
    },
    async lessonRows(userId, courseSlug) {
      return must(await db.from("lesson_progress").select("lesson_code,position_seconds,completed_at").eq("user_id", userId).eq("course_slug", courseSlug), "lessons") as LessonRow[];
    },
    async attemptRows(userId, courseSlug) {
      return must(
        await db.from("quiz_attempts").select("quiz_key,answers,score,total,passed,attempted_at").eq("user_id", userId).eq("course_slug", courseSlug).order("attempted_at"),
        "attempts",
      ) as AttemptRow[];
    },
    async certificateRows(userId) {
      return must(await db.from("certificates").select("number,course_slug,full_name,issued_at").eq("user_id", userId), "certificates") as CertificateRow[];
    },
    async completeLesson(userId, courseSlug, lessonCode) {
      const now = new Date().toISOString();
      must(
        await db.from("lesson_progress").upsert({ user_id: userId, course_slug: courseSlug, lesson_code: lessonCode, completed_at: now, updated_at: now }, { onConflict: "user_id,course_slug,lesson_code" }),
        "complete lesson",
      );
    },
    async savePosition(userId, courseSlug, lessonCode, seconds) {
      // Keeps completed_at if the lesson is already done: an upsert would overwrite it with null.
      const existing = must(
        await db.from("lesson_progress").select("completed_at").eq("user_id", userId).eq("course_slug", courseSlug).eq("lesson_code", lessonCode).maybeSingle(),
        "position lookup",
      ) as { completed_at: string | null } | null;
      must(
        await db.from("lesson_progress").upsert(
          { user_id: userId, course_slug: courseSlug, lesson_code: lessonCode, position_seconds: seconds, completed_at: existing?.completed_at ?? null, updated_at: new Date().toISOString() },
          { onConflict: "user_id,course_slug,lesson_code" },
        ),
        "save position",
      );
    },
    async insertAttempt(userId, courseSlug, a) {
      return must(
        await db.from("quiz_attempts").insert({ user_id: userId, course_slug: courseSlug, ...a }).select("quiz_key,answers,score,total,passed,attempted_at").single(),
        "insert attempt",
      ) as AttemptRow;
    },
    async issueCertificate(userId, courseSlug, courseCode, fullName) {
      const existing = must(await db.from("certificates").select("number,course_slug,full_name,issued_at").eq("user_id", userId).eq("course_slug", courseSlug).maybeSingle(), "certificate lookup") as CertificateRow | null;
      if (existing) return existing;
      const number = must(await db.rpc("next_certificate_number", { p_code: courseCode }), "certificate number") as string;
      return must(
        await db.from("certificates").insert({ user_id: userId, course_slug: courseSlug, number, full_name: fullName }).select("number,course_slug,full_name,issued_at").single(),
        "issue certificate",
      ) as CertificateRow;
    },
    async certificateByNumber(number) {
      return must(await db.from("certificates").select("number,course_slug,full_name,issued_at").eq("number", number).maybeSingle(), "certificate by number") as CertificateRow | null;
    },
  };
}
