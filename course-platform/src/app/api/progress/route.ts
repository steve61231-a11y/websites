import { connection } from "next/server";
import { courses } from "@/lib/catalog";
import { allow } from "@/lib/server/limit";
import { canTakeQuiz, canWatch, findLesson, findQuiz, grade, snapshot } from "@/lib/server/learn";
import { supabaseStore } from "@/lib/server/store";
import { crossSite, json, readJson, requireUser, str } from "../_http";

// POST /api/progress: the three things that change a student's progress.
//   {action:"lesson", lessonId}            a video is finished
//   {action:"position", lessonId, seconds} where they stopped watching
//   {action:"quiz", quizId, answers}       a quiz attempt, graded here
// Each is checked against enrolment and the unlock rules before it's saved.

export async function POST(request: Request) {
  await connection();
  if (crossSite(request)) return json(403, { error: "cross-site" });
  const auth = await requireUser(request);
  if (auth.response) return auth.response;
  if (!allow(`progress:${auth.user.id}`, 240, 60_000)) return json(429, { error: "slow down" });
  const body = await readJson(request, 20_000);
  if (!body) return json(400, { error: "bad request" });

  const store = supabaseStore();
  const slugs = await store.enrolledCourses(auth.user.id);
  const mine = courses.filter((c) => slugs.includes(c.slug));
  const idOrNull = (k: string) => str(body[k], 80);

  if (body.action === "lesson" || body.action === "position") {
    const lessonId = idOrNull("lessonId");
    const hit = lessonId ? mine.map((course) => ({ course, ...findLesson(course, lessonId) })).find((h) => h.lesson) : undefined;
    if (!hit?.lesson || !hit.module) return json(403, { error: "You don't have access to that lesson." });
    const { course, module, lesson } = hit;
    const state = snapshot(course, await store.lessonRows(auth.user.id, course.slug), await store.attemptRows(auth.user.id, course.slug), []);
    if (!canWatch(state, course, module)) return json(403, { error: "Finish the previous day first." });
    if (body.action === "lesson") {
      await store.completeLesson(auth.user.id, course.slug, lesson.code);
      return json(200, { ok: true, completedAt: new Date().toISOString() });
    }
    const seconds = typeof body.seconds === "number" && Number.isFinite(body.seconds) ? Math.max(0, Math.min(Math.floor(body.seconds), lesson.durationSec + 60)) : null;
    if (seconds === null) return json(400, { error: "bad position" });
    await store.savePosition(auth.user.id, course.slug, lesson.code, seconds);
    return json(200, { ok: true });
  }

  if (body.action === "quiz") {
    const quizId = idOrNull("quizId");
    const hit = quizId ? mine.map((course) => ({ course, ...findQuiz(course, quizId) })).find((h) => h.quiz) : undefined;
    if (!hit?.quiz || !hit.module) return json(403, { error: "You don't have access to that quiz." });
    const { course, module, quiz } = hit;
    const state = snapshot(course, await store.lessonRows(auth.user.id, course.slug), await store.attemptRows(auth.user.id, course.slug), []);
    if (!canTakeQuiz(state, course, module)) return json(403, { error: "Watch every video in this day first." });
    const graded = body.answers && typeof body.answers === "object" ? grade(quiz, body.answers as Record<string, unknown>) : null;
    if (!graded) return json(400, { error: "Please answer every question." });
    const saved = await store.insertAttempt(auth.user.id, course.slug, { quiz_key: quiz.id, ...graded });
    return json(200, { ok: true, attempt: { score: saved.score, total: saved.total, passed: saved.passed, answers: saved.answers, at: saved.attempted_at } });
  }

  return json(400, { error: "unknown action" });
}
