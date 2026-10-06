"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { formatDuration } from "@/lib/catalog";
import { useDemo } from "@/lib/demo-store";
import {
  courseComplete,
  courseProgress,
  moduleProgress,
  moduleStatus,
  nextStep,
  quizPassed,
  type ModuleStatus,
} from "@/lib/progress";
import type { Course, Module } from "@/lib/types";
import { Check, ChevronDown, Doc, Lock, Play } from "./icons";
import { ProgressDial } from "./progress-dial";

export function CourseHome({ course }: { course: Course }) {
  const state = useDemo();
  const pct = Math.round(courseProgress(state, course) * 100);
  const step = nextStep(state, course);
  const done = courseComplete(state, course);
  const segments = course.modules.map((m) => moduleProgress(state, m));
  const current = course.modules.findIndex((m) => moduleStatus(state, course, m) === "current");
  const cert = state.certificates.find((c) => c.courseId === course.id);

  let eyebrow = "";
  let title = "";
  let meta = "";
  let href = "";
  let cta = "";
  if (step.kind === "lesson") {
    eyebrow = `Module ${step.module.position} · Lesson ${step.module.lessons.indexOf(step.lesson) + 1}`;
    title = step.lesson.title;
    meta = `${Math.round(step.lesson.durationSec / 60)} min`;
    href = `/learn/${course.slug}/${step.lesson.id}`;
    cta = step.started ? "Continue" : "Start the course";
  } else if (step.kind === "quiz") {
    eyebrow = `Module ${step.module.position} · Quiz`;
    title = step.module.quiz!.title;
    meta = `${step.module.quiz!.questions.length} questions · about ${Math.max(2, Math.round(step.module.quiz!.questions.length * 0.5))} min`;
    href = `/learn/${course.slug}/quiz/${step.module.id}`;
    cta = "Take the quiz";
  } else {
    eyebrow = "Course complete";
    title = "You did it.";
    meta = cert ? cert.number : "Your certificate is ready";
    href = cert ? `/certificates/${cert.number}` : `/learn/${course.slug}/complete`;
    cta = "View certificate";
  }

  const remaining = course.modules.length - segments.filter((s) => s >= 1).length;

  return (
    <section>
      {/* Up next */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="card grid items-center gap-8 p-7 sm:grid-cols-[auto_1fr] sm:gap-12 sm:p-10"
      >
        <div className="mx-auto">
          <ProgressDial segments={segments} size={200} stroke={9} highlight={current}>
            <div>
              <p className="text-[48px] font-semibold leading-none tracking-[-0.04em] tabular-nums">
                {pct}
                <span className="text-[24px] text-faint">%</span>
              </p>
              <p className="mt-1.5 text-[12px] text-muted">{done ? "complete" : `${remaining} ${remaining === 1 ? "module" : "modules"} to go`}</p>
            </div>
          </ProgressDial>
        </div>
        <div className="text-center sm:text-left">
          <p className="eyebrow">{course.title}</p>
          <p className="mt-5 text-[13px] font-medium text-accent">{eyebrow}</p>
          <h2 className="mt-1 text-[clamp(26px,3.6vw,36px)] font-semibold leading-tight tracking-[-0.03em]">{title}</h2>
          <p className="mt-1 text-[15px] text-muted">{meta}</p>
          <Link href={href} className={`btn btn-lg mt-7 ${done ? "btn-dark" : "btn-primary"}`}>
            {step.kind === "lesson" && <Play size={16} />}
            {cta}
          </Link>
        </div>
      </motion.div>

      {/* Journey */}
      <div className="mt-14">
        <div className="flex items-baseline justify-between">
          <h3 className="text-[24px] font-semibold tracking-[-0.025em]">Your path</h3>
          <p className="text-[13px] text-muted">{course.modules.length} modules</p>
        </div>
        <ol className="relative mt-6">
          {course.modules.map((m, i) => (
            <ModuleRow
              key={m.id}
              course={course}
              module={m}
              status={moduleStatus(state, course, m)}
              last={i === course.modules.length - 1}
              index={i}
            />
          ))}
        </ol>
      </div>
    </section>
  );
}

function ModuleRow({
  course,
  module,
  status,
  last,
  index,
}: {
  course: Course;
  module: Module;
  status: ModuleStatus;
  last: boolean;
  index: number;
}) {
  const state = useDemo();
  const [open, setOpen] = useState(status === "current");
  const total = module.lessons.reduce((s, l) => s + l.durationSec, 0);
  const progress = moduleProgress(state, module);
  const locked = status === "locked";
  const best = module.quiz ? Math.max(0, ...(state.quizAttempts[module.quiz.id] ?? []).map((a) => a.score)) : 0;
  const prev = course.modules[index - 1];

  return (
    <motion.li
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="relative grid grid-cols-[40px_minmax(0,1fr)] gap-4"
    >
      {/* Rail */}
      {!last && (
        <span
          className={`absolute left-[19px] top-11 bottom-0 w-[2px] ${status === "complete" ? "bg-success" : "bg-line"}`}
          aria-hidden
        />
      )}
      <Node status={status} />

      <div className={`pb-6 ${locked ? "opacity-55" : ""}`}>
        <button
          onClick={() => !locked && setOpen((o) => !o)}
          disabled={locked}
          className="flex w-full items-start gap-3 rounded-2xl text-left"
          aria-expanded={open}
        >
          <span className="flex-1 pt-0.5">
            <span className="block text-[12px] font-medium tabular-nums text-faint">Module {String(module.position).padStart(2, "0")}</span>
            <span className="mt-0.5 block text-[19px] font-semibold tracking-[-0.015em]">{module.title}</span>
            <span className="mt-0.5 block text-[14px] text-muted">
              {locked && prev
                ? `Pass the Module ${prev.position} quiz to unlock`
                : status === "complete"
                  ? `Completed${module.quiz ? ` · Quiz ${best}/${module.quiz.questions.length}` : ""}`
                  : `${module.lessons.length} ${module.lessons.length === 1 ? "lesson" : "lessons"} · ${formatDuration(total)}`}
            </span>
          </span>
          {!locked && (
            <motion.span animate={{ rotate: open ? 180 : 0 }} className="mt-5 text-faint">
              <ChevronDown size={18} />
            </motion.span>
          )}
        </button>

        {status === "current" && progress > 0 && (
          <div className="mt-3 h-1 w-full max-w-xs overflow-hidden rounded-full bg-fill">
            <motion.div
              className="h-full rounded-full bg-accent"
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        )}

        <AnimatePresence initial={false}>
          {open && !locked && (
            <motion.ul
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="mt-3 overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_4px_20px_rgba(0,0,0,0.04)]"
            >
              {module.lessons.map((l, i) => {
                const doneLesson = !!state.completedLessons[l.id];
                const position = state.positions[l.id] ?? 0;
                return (
                  <li key={l.id} className="border-b border-line/70 last:border-0">
                    <Link
                      href={`/learn/${course.slug}/${l.id}`}
                      className="flex min-h-14 items-center gap-3.5 px-4 py-3 transition-colors hover:bg-fill/60"
                    >
                      <span
                        className={`grid size-7 shrink-0 place-items-center rounded-full text-[12px] font-semibold ${
                          doneLesson ? "bg-success text-white" : "bg-fill text-muted"
                        }`}
                      >
                        {doneLesson ? <Check size={14} strokeWidth={2.6} /> : i + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px]">{l.title}</span>
                        {!doneLesson && position > 0 && (
                          <span className="block text-[12px] text-accent">Resume at {Math.floor(position / 60)}:{String(Math.floor(position % 60)).padStart(2, "0")}</span>
                        )}
                      </span>
                      <span className="text-[13px] tabular-nums text-faint">{Math.round(l.durationSec / 60)} min</span>
                    </Link>
                  </li>
                );
              })}
              {module.quiz && (
                <li>
                  <QuizRow course={course} module={module} />
                </li>
              )}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </motion.li>
  );
}

function QuizRow({ course, module }: { course: Course; module: Module }) {
  const state = useDemo();
  const quiz = module.quiz!;
  const ready = module.lessons.every((l) => state.completedLessons[l.id]);
  const passed = quizPassed(state, quiz.id);
  const inner = (
    <>
      <span className={`grid size-7 shrink-0 place-items-center rounded-full ${passed ? "bg-success text-white" : ready ? "bg-accent text-white" : "bg-fill text-faint"}`}>
        {passed ? <Check size={14} strokeWidth={2.6} /> : ready ? <Doc size={14} /> : <Lock size={13} />}
      </span>
      <span className="flex-1 text-[15px] font-medium">{module.position === 7 ? "Final assessment" : "Module quiz"}</span>
      <span className="text-[13px] text-faint">{passed ? "Passed" : ready ? `${quiz.questions.length} questions` : "Finish lessons first"}</span>
    </>
  );
  return ready ? (
    <Link href={`/learn/${course.slug}/quiz/${module.id}`} className="flex min-h-14 items-center gap-3.5 px-4 py-3 hover:bg-fill/60">
      {inner}
    </Link>
  ) : (
    <div className="flex min-h-14 items-center gap-3.5 px-4 py-3 opacity-70">{inner}</div>
  );
}

function Node({ status }: { status: ModuleStatus }) {
  if (status === "complete")
    return (
      <span className="relative z-10 mt-1 grid size-10 place-items-center rounded-full bg-success text-white">
        <Check size={20} strokeWidth={2.4} />
      </span>
    );
  if (status === "current")
    return (
      <span className="relative z-10 mt-1 grid size-10 place-items-center">
        <span className="absolute inset-0 animate-ping rounded-full bg-accent/20 [animation-duration:2.4s]" />
        <span className="relative grid size-10 place-items-center rounded-full border-[2.5px] border-accent bg-white">
          <span className="size-3 rounded-full bg-accent" />
        </span>
      </span>
    );
  return (
    <span className="relative z-10 mt-1 grid size-10 place-items-center rounded-full bg-fill text-faint">
      <Lock size={16} />
    </span>
  );
}
