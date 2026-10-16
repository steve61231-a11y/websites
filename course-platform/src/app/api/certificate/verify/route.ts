import { connection } from "next/server";
import { getCourse } from "@/lib/catalog";
import { backendConfigured } from "@/lib/server/env";
import { allow, clientIp } from "@/lib/server/limit";
import { supabaseStore } from "@/lib/server/store";
import { json, notConfigured } from "../../_http";

// GET /api/certificate/verify?number=CERT-2026-PHOTO-000001
// Public: anyone can check a certificate. Reveals only the name, course and date.

export async function GET(request: Request) {
  await connection();
  if (!backendConfigured()) return notConfigured();
  if (!allow(`verify:${clientIp(request)}`, 30, 60_000)) return json(429, { error: "slow down" });
  const number = (new URL(request.url).searchParams.get("number") ?? "").trim().toUpperCase();
  if (!/^CERT-\d{4}-[A-Z0-9]{2,12}-\d{6}$/.test(number)) return json(200, { valid: false });
  const row = await supabaseStore().certificateByNumber(number);
  if (!row) return json(200, { valid: false });
  const course = getCourse(row.course_slug);
  return json(200, { valid: true, number: row.number, name: row.full_name, courseId: course?.id ?? row.course_slug, issuedAt: row.issued_at });
}
