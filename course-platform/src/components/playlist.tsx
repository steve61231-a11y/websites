"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { formatDuration } from "@/lib/catalog";
import { useDemo } from "@/lib/demo-store";
import { moduleLessonsComplete, moduleStatus, quizPassed } from "@/lib/progress";
import type { Course } from "@/lib/types";
import { ChevronLeft, ChevronRight, Lock } from "./icons";
import { LessonThumb } from "./lesson-thumb";

// The lesson list that sits beside the player. It shows one module at a time,
// so it reads the same whether a module holds one video or ten.

export function Playlist({ course, currentModuleId, currentLessonId }: { course: Course; currentModuleId: string; currentLessonId?: string }) {
  const state = useDemo();
  const start = course.modules.findIndex((m) => m.id === currentModuleId);
  const [view, setView] = useState(start);
  const [dir, setDir] = useState(0);
  const mod = course.modules[view];
  const status = moduleStatus(state, course, mod);
  const locked = status === "locked";
  const total = mod.lessons.reduce((s, l) => s + l.durationSec, 0);
  const lessonsDone = moduleLessonsComplete(state, mod);
  const passed = mod.quiz ? quizPassed(state, mod.quiz.id) : true;
  const next = course.modules[view + 1];

  const go = (d: number) => {
    setDir(d);
    setView((v) => Math.max(0, Math.min(course.modules.length - 1, v + d)));
  };

  return (
    <section className="overflow-hidden rounded-[24px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_32px_rgba(0,0,0,0.05)]">
      {/* Header */}
      <div className="flex items-start gap-2 border-b border-line px-5 pb-4 pt-5">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-medium text-faint">
            Module {mod.position} of {course.modules.length}
          </p>
          <p className="mt-0.5 truncate text-[19px] font-semibold tracking-[-0.02em]">{mod.title}</p>
          <p className="text-[13px] text-muted">
            {mod.lessons.length} {mod.lessons.length === 1 ? "lesson" : "lessons"} · {formatDuration(total)}
          </p>
        </div>
        <div className="flex gap-1 pt-1">
          <button onClick={() => go(-1)} disabled={view === 0} aria-label="Previous module" className="grid size-8 place-items-center rounded-full bg-fill text-ink-2 disabled:opacity-30">
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => go(1)} disabled={view === course.modules.length - 1} aria-label="Next module" className="grid size-8 place-items-center rounded-full bg-fill text-ink-2 disabled:opacity-30">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Module dots */}
      <div className="flex gap-1 px-5 pt-3" aria-hidden>
        {course.modules.map((m, i) => {
          const s = moduleStatus(state, course, m);
          return (
            <button
              key={m.id}
              tabIndex={-1}
              onClick={() => go(i - view)}
              className={`h-1 flex-1 rounded-full transition-colors ${
                s === "complete" ? "bg-success" : s === "current" ? "bg-accent" : "bg-line"
              } ${i === view ? "opacity-100" : "opacity-45"}`}
            />
          );
        })}
      </div>

      <AnimatePresence mode="wait" initial={false} custom={dir}>
        <motion.ul
          key={mod.id}
          initial={{ opacity: 0, x: dir * 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: dir * -24 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="p-2"
        >
          {mod.lessons.map((l, i) => {
            const current = l.id === currentLessonId;
            const done = !!state.completedLessons[l.id];
            const row = (
              <>
                <LessonThumb
                  module={mod}
                  lesson={l}
                  index={i}
                  done={done}
                  current={current}
                  progress={(state.positions[l.id] ?? 0) / l.durationSec}
                  className="w-[112px]"
                />
                <span className="min-w-0 flex-1">
                  <span className={`block text-[12px] font-medium ${current ? "text-accent" : "text-faint"}`}>
                    {current ? "Now playing" : `Lesson ${i + 1}`}
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-[15px] font-medium leading-snug">{l.title}</span>
                  <span className="mt-0.5 block text-[12px] text-faint">{Math.round(l.durationSec / 60)} min</span>
                </span>
              </>
            );
            return (
              <li key={l.id}>
                {locked ? (
                  <div className="flex items-center gap-3.5 rounded-2xl p-2.5 opacity-45">{row}</div>
                ) : (
                  <Link
                    href={`/learn/${course.slug}/${l.id}`}
                    aria-current={current ? "true" : undefined}
                    className={`flex items-center gap-3.5 rounded-2xl p-2.5 transition-colors ${current ? "bg-accent/[0.07]" : "hover:bg-fill/70"}`}
                  >
                    {row}
                  </Link>
                )}
              </li>
            );
          })}
          {mod.quiz && (
            <li>
              {(() => {
                const ready = !locked && lessonsDone;
                const inner = (
                  <>
                    <LessonThumb module={mod} done={passed} className="w-[112px]" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12px] font-medium text-faint">
                        {mod.position === course.modules.length ? "Final assessment" : "Module quiz"}
                      </span>
                      <span className="mt-0.5 block text-[15px] font-medium">{passed ? "Passed" : `${mod.quiz.questions.length} questions`}</span>
                      <span className="mt-0.5 block text-[12px] text-faint">{ready ? "Ready when you are" : "Unlocks after the lessons"}</span>
                    </span>
                  </>
                );
                return ready ? (
                  <Link href={`/learn/${course.slug}/quiz/${mod.id}`} className="flex items-center gap-3.5 rounded-2xl p-2.5 hover:bg-fill/70">
                    {inner}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3.5 rounded-2xl p-2.5 opacity-45">{inner}</div>
                );
              })()}
            </li>
          )}
        </motion.ul>
      </AnimatePresence>

      {/* Footer action */}
      <div className="border-t border-line p-4">
        {locked ? (
          <p className="flex items-center justify-center gap-2 py-2 text-[13px] text-muted">
            <Lock size={14} /> Pass the Module {mod.position - 1} quiz to unlock
          </p>
        ) : lessonsDone && !passed ? (
          <Link href={`/learn/${course.slug}/quiz/${mod.id}`} className="btn btn-primary w-full">Take the quiz</Link>
        ) : passed && lessonsDone && next ? (
          <Link href={`/learn/${course.slug}/${next.lessons[0].id}`} className="btn btn-dark w-full">
            Next module <ChevronRight size={18} />
          </Link>
        ) : passed && lessonsDone ? (
          <Link href={`/learn/${course.slug}/complete`} className="btn btn-dark w-full">View certificate</Link>
        ) : (
          <Link href={`/learn/${course.slug}`} className="btn btn-quiet w-full">See the whole course</Link>
        )}
      </div>
    </section>
  );
}
