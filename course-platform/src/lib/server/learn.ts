import { getCourse } from "../catalog.ts";
import { courseComplete, moduleLessonsComplete, moduleUnlocked, type ProgressState, type QuizAttempt } from "../progress.ts";
import type { Course, Module, Quiz } from "../types.ts";
import type { AttemptRow, CertificateRow, LessonRow } from "./store.ts";

// The rules a student's progress must obey, re-checked on the server. The
// browser keeps its own copy for speed, but only what passes here is saved.
// Pure functions: the routes load rows, ask these, then write.

export type Snapshot = ProgressState & {
  positions: Record<string, number>; // lessonId → seconds
  certificates: { number: string; courseId: string; name: string; issuedAt: string }[];
};

/** Database rows → the same shape the app uses (lessons are keyed by id, rows by their "2.3" code). */
export function snapshot(course: Course, lessons: LessonRow[], attempts: AttemptRow[], certs: CertificateRow[]): Snapshot {
  const idByCode = new Map(course.modules.flatMap((m) => m.lessons.map((l) => [l.code, l.id] as const)));
  const completedLessons: Record<string, string> = {};
  const positions: Record<string, number> = {};
  for (const r of lessons) {
    const id = idByCode.get(r.lesson_code);
    if (!id) continue; // a lesson that no longer exists
    if (r.completed_at) completedLessons[id] = r.completed_at;
    if (r.position_seconds > 0) positions[id] = r.position_seconds;
  }
  const quizAttempts: Record<string, QuizAttempt[]> = {};
  for (const a of attempts) (quizAttempts[a.quiz_key] ??= []).push({ score: a.score, total: a.total, passed: a.passed, answers: a.answers, at: a.attempted_at });
  return {
    completedLessons,
    quizAttempts,
    positions,
    certificates: certs.filter((c) => c.course_slug === course.slug).map((c) => ({ number: c.number, courseId: course.id, name: c.full_name, issuedAt: c.issued_at })),
  };
}

export function findLesson(course: Course, lessonId: string) {
  for (const mod of course.modules) {
    const lesson = mod.lessons.find((l) => l.id === lessonId);
    if (lesson) return { module: mod, lesson };
  }
  return undefined;
}

export function findQuiz(course: Course, quizId: string): { module: Module; quiz: Quiz } | undefined {
  const mod = course.modules.find((m) => m.quiz?.id === quizId);
  return mod?.quiz ? { module: mod, quiz: mod.quiz } : undefined;
}

/** A video can be finished once its day is unlocked. */
export const canWatch = (state: ProgressState, course: Course, module: Module) => moduleUnlocked(state, course, module);

/** A quiz can be taken once its day is unlocked and every video in it is done. */
export const canTakeQuiz = (state: ProgressState, course: Course, module: Module) => moduleUnlocked(state, course, module) && moduleLessonsComplete(state, module);

export const canIssueCertificate = (state: ProgressState, course: Course) => courseComplete(state, course);

/** Grades a quiz from the student's answers, using the answer key only the server trusts. */
export function grade(quiz: Quiz, answers: Record<string, unknown>): { score: number; total: number; passed: boolean; answers: Record<string, string> } | null {
  const clean: Record<string, string> = {};
  for (const q of quiz.questions) {
    const picked = answers[q.id];
    if (typeof picked !== "string" || !q.options.some((o) => o.id === picked)) return null; // missing or invented answer
    clean[q.id] = picked;
  }
  const total = quiz.questions.length;
  const score = quiz.questions.filter((q) => q.options.find((o) => o.id === clean[q.id])?.correct).length;
  return { score, total, passed: score >= Math.ceil(quiz.passingScore * total), answers: clean };
}

/** The name printed on a certificate: trimmed, one space between words, 2-60 characters. */
export function certificateName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const name = raw.replace(/\s+/g, " ").trim();
  return name.length >= 2 && name.length <= 60 && !/[<>\u0000-\u001f]/.test(name) ? name : null;
}

export { getCourse };
