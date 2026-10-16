import { connection } from "next/server";
import { brand, courses } from "@/lib/catalog";
import { certificateEmail } from "@/lib/certificate-email";
import { env } from "@/lib/server/env";
import { sendEmail } from "@/lib/server/email";
import { canIssueCertificate, certificateName, snapshot } from "@/lib/server/learn";
import { supabaseStore } from "@/lib/server/store";
import { crossSite, json, readJson, requireUser, str } from "../_http";

// POST /api/certificate {courseId, name}: issue the certificate once the
// whole course is done (every video watched, every quiz passed: re-checked
// here from the saved records). The name is frozen at this moment.

export async function POST(request: Request) {
  await connection();
  if (crossSite(request)) return json(403, { error: "cross-site" });
  const auth = await requireUser(request);
  if (auth.response) return auth.response;
  const body = await readJson(request);
  const store = supabaseStore();
  const slugs = await store.enrolledCourses(auth.user.id);
  const course = courses.find((c) => c.id === (body ? str(body.courseId, 60) : null) && slugs.includes(c.slug));
  if (!body || !course) return json(403, { error: "You don't have access to that course." });
  const name = certificateName(body.name);
  if (!name) return json(400, { error: "Please enter your name as it should appear (2 to 60 characters)." });

  const certs = await store.certificateRows(auth.user.id);
  const state = snapshot(course, await store.lessonRows(auth.user.id, course.slug), await store.attemptRows(auth.user.id, course.slug), certs);
  const existing = certs.find((c) => c.course_slug === course.slug);
  if (!existing && !canIssueCertificate(state, course)) return json(403, { error: "Finish every video and pass every quiz first." });

  const row = existing ?? (await store.issueCertificate(auth.user.id, course.slug, course.code, name));
  if (!existing) {
    const cert = { number: row.number, courseId: course.id, name: row.full_name, issuedAt: row.issued_at };
    const mail = certificateEmail(cert, course, `${env.siteUrl()}/certificate/${encodeURIComponent(row.number)}`);
    try {
      await sendEmail({ to: auth.user.email, subject: mail.subject, html: mail.html, text: mail.text });
    } catch (e) {
      console.error("[certificate] email failed", e); // the certificate exists regardless; they can download it in the app
    }
  }
  return json(200, { ok: true, certificate: { number: row.number, courseId: course.id, name: row.full_name, issuedAt: row.issued_at }, school: brand.name });
}
