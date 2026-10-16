import { connection } from "next/server";
import { courses } from "@/lib/catalog";
import { snapshot } from "@/lib/server/learn";
import { admin, supabaseStore } from "@/lib/server/store";
import { crossSite, json, readJson, requireUser, str } from "../_http";

// GET /api/me: everything the app needs to know about the signed-in student.
// PATCH /api/me {name}: change the name shown in the app.

export async function GET(request: Request) {
  await connection();
  const auth = await requireUser(request);
  if (auth.response) return auth.response;
  const store = supabaseStore();
  const profile = await store.profile(auth.user.id);
  const slugs = await store.enrolledCourses(auth.user.id);
  const certs = await store.certificateRows(auth.user.id);

  const merged = { completedLessons: {} as Record<string, string>, quizAttempts: {} as Record<string, unknown[]>, positions: {} as Record<string, number>, certificates: [] as unknown[] };
  const enrolled: string[] = [];
  for (const course of courses.filter((c) => slugs.includes(c.slug))) {
    enrolled.push(course.id);
    const s = snapshot(course, await store.lessonRows(auth.user.id, course.slug), await store.attemptRows(auth.user.id, course.slug), certs);
    Object.assign(merged.completedLessons, s.completedLessons);
    Object.assign(merged.quizAttempts, s.quizAttempts);
    Object.assign(merged.positions, s.positions);
    merged.certificates.push(...s.certificates);
  }
  const name = profile?.full_name || auth.user.email.split("@")[0];
  return json(200, { user: { name, email: auth.user.email, watermarkId: profile?.watermark_id ?? null }, enrolled, ...merged });
}

export async function PATCH(request: Request) {
  await connection();
  if (crossSite(request)) return json(403, { error: "cross-site" });
  const auth = await requireUser(request);
  if (auth.response) return auth.response;
  const body = await readJson(request);
  const name = body ? str(body.name, 80) : null;
  if (!name) return json(400, { error: "Please enter a name." });
  const { error } = await admin().from("profiles").update({ full_name: name }).eq("id", auth.user.id);
  return error ? json(500, { error: "Couldn't save your name." }) : json(200, { ok: true, name });
}
