import type { Course, Lesson, Module } from "./types";

// Pure progress rules. The same logic runs server-side in Phase 2 so that
// unlocking and certificate eligibility can't be faked from the browser.

export type QuizAttempt = {
  score: number;
  total: number;
  passed: boolean;
  answers: Record<string, string>;
  at: string;
};

export type ProgressState = {
  completedLessons: Record<string, string>; // lessonId → ISO date
  quizAttempts: Record<string, QuizAttempt[]>; // quizId → attempts
};

export function quizPassed(state: ProgressState, quizId: string) {
  return (state.quizAttempts[quizId] ?? []).some((a) => a.passed);
}

export function lessonsDone(state: ProgressState, module: Module) {
  return module.lessons.filter((l) => state.completedLessons[l.id]).length;
}

export function moduleLessonsComplete(state: ProgressState, module: Module) {
  return lessonsDone(state, module) === module.lessons.length;
}

export function moduleComplete(state: ProgressState, module: Module) {
  return moduleLessonsComplete(state, module) && (!module.quiz || quizPassed(state, module.quiz.id));
}

export function moduleUnlocked(state: ProgressState, course: Course, module: Module) {
  const index = course.modules.indexOf(module);
  return index <= 0 || moduleComplete(state, course.modules[index - 1]);
}

function units(module: Module) {
  return module.lessons.length + (module.quiz ? 1 : 0);
}

function unitsDone(state: ProgressState, module: Module) {
  return lessonsDone(state, module) + (module.quiz && quizPassed(state, module.quiz.id) ? 1 : 0);
}

export function moduleProgress(state: ProgressState, module: Module) {
  return unitsDone(state, module) / units(module);
}

export function courseProgress(state: ProgressState, course: Course) {
  const total = course.modules.reduce((s, m) => s + units(m), 0);
  const done = course.modules.reduce((s, m) => s + unitsDone(state, m), 0);
  return total === 0 ? 0 : done / total;
}

export function courseComplete(state: ProgressState, course: Course) {
  return course.modules.every((m) => moduleComplete(state, m));
}

export type ModuleStatus = "complete" | "current" | "locked";

export function moduleStatus(state: ProgressState, course: Course, module: Module): ModuleStatus {
  if (moduleComplete(state, module)) return "complete";
  return moduleUnlocked(state, course, module) ? "current" : "locked";
}

export type NextStep =
  | { kind: "lesson"; module: Module; lesson: Lesson; started: boolean }
  | { kind: "quiz"; module: Module }
  | { kind: "done" };

export function nextStep(state: ProgressState, course: Course): NextStep {
  const started = Object.keys(state.completedLessons).length > 0;
  for (const mod of course.modules) {
    const lesson = mod.lessons.find((l) => !state.completedLessons[l.id]);
    if (lesson) return { kind: "lesson", module: mod, lesson, started };
    if (mod.quiz && !quizPassed(state, mod.quiz.id)) return { kind: "quiz", module: mod };
  }
  return { kind: "done" };
}

/** The lesson that follows `lessonId`, crossing into the next module. */
export function lessonAfter(course: Course, lessonId: string) {
  const all = course.modules.flatMap((m) => m.lessons.map((l) => ({ module: m, lesson: l })));
  const i = all.findIndex((x) => x.lesson.id === lessonId);
  return i >= 0 ? all[i + 1] : undefined;
}

export function lessonBefore(course: Course, lessonId: string) {
  const all = course.modules.flatMap((m) => m.lessons.map((l) => ({ module: m, lesson: l })));
  const i = all.findIndex((x) => x.lesson.id === lessonId);
  return i > 0 ? all[i - 1] : undefined;
}
