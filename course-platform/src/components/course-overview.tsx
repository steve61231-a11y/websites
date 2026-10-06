"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { formatDuration } from "@/lib/catalog";
import { useDemo } from "@/lib/demo-store";
import { courseComplete, moduleProgress, moduleStatus, nextStep, quizPassed } from "@/lib/progress";
import type { Course } from "@/lib/types";
import { Award, Check, ChevronDown, Lock, Play } from "./icons";
import { LensArt } from "./lens-art";
import { LessonThumb } from "./lesson-thumb";
import { ProgressDial } from "./progress-dial";

export function CourseOverview({ course }: { course: Course }) {
  const state = useDemo();
  const lessons = course.modules.flatMap((m) => m.lessons);
  const doneCount = lessons.filter((l) => state.completedLessons[l.id]).length;
  const quizzes = course.modules.filter((m) => m.quiz);
  const passedCount = quizzes.filter((m) => quizPassed(state, m.quiz!.id)).length;
  const step = nextStep(state, course);
  const finished = courseComplete(state, course);
  const cert = state.certificates.find((c) => c.courseId === course.id);
  const segments = course.modules.map((m) => moduleProgress(state, m));
  // Finished modules start collapsed so the page opens on what is left to do.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const resume =
    step.kind === "lesson"
      ? {
          href: `/learn/${course.slug}/${step.lesson.id}`,
          label: step.started ? "Resume course" : "Start course",
          sub: `${step.module.position}.${step.module.lessons.indexOf(step.lesson) + 1} · ${step.lesson.title}`,
        }
      : step.kind === "quiz"
        ? { href: `/learn/${course.slug}/quiz/${step.module.id}`, label: "Take the quiz", sub: `Module ${step.module.position} · ${step.module.title}` }
        : { href: cert ? `/certificates/${cert.number}` : `/learn/${course.slug}/complete`, label: "View certificate", sub: "Course complete" };

  return (
    <>
      {/* Banner */}
      <section className="relative overflow-hidden bg-night text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_40%,#1d3557_0%,transparent_60%)]" />
        <LensArt
          className="absolute -right-[8%] top-1/2 h-[150%] -translate-y-1/2 opacity-60 blur-[3px] sm:right-[2%]"
          animate={false}
          aperture={0.3 + (doneCount / lessons.length) * 0.7}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
        <div className="wrap relative py-16 sm:py-24">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
            <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-[#f5a623]">{course.level}</p>
            <h1 className="display mt-3 max-w-[12ch] text-[clamp(40px,7vw,76px)]">{course.title}</h1>
            <div className="mt-9 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-5">
              <Link href={resume.href} className="btn btn-light btn-lg">
                {step.kind === "lesson" ? <Play size={16} /> : finished ? <Award size={18} /> : null}
                {resume.label}
              </Link>
              <span className="max-w-xs truncate text-[14px] text-white/60">{resume.sub}</span>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="wrap grid gap-10 py-10 sm:py-14 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-14">
        {/* Left column */}
        <aside className="space-y-4 lg:sticky lg:top-[68px] lg:self-start">
          <div className="card p-6">
            <div className="flex items-center gap-5">
              <ProgressDial segments={segments} size={96} stroke={6}>
                <span className="text-[22px] font-semibold tabular-nums tracking-tight">
                  {Math.round((doneCount / lessons.length) * 100)}
                  <span className="text-[12px] text-faint">%</span>
                </span>
              </ProgressDial>
              <div>
                <p className="text-[19px] font-semibold leading-tight tracking-[-0.02em]">
                  {doneCount} of {lessons.length} lessons completed
                </p>
                <p className="mt-1 text-[13px] text-muted">
                  {passedCount} of {quizzes.length} quizzes passed
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-3 rounded-2xl bg-fill/70 p-3.5">
              <span className={`grid size-9 place-items-center rounded-full ${finished ? "bg-gold text-white" : "bg-white text-faint"}`}>
                <Award size={18} />
              </span>
              <span className="text-[13px] leading-snug">
                <span className="block font-medium">Certificate</span>
                <span className="text-muted">{finished ? "Earned. Ready to download." : "Unlocks when you pass the final assessment"}</span>
              </span>
            </div>
          </div>

          <div className="card p-6">
            <p className="text-[13px] font-medium text-muted">Instructor</p>
            <div className="mt-3 flex items-center gap-3">
              <span className="grid size-12 place-items-center rounded-full bg-gradient-to-br from-[#2c2c2e] to-black text-[15px] font-semibold text-white">
                {course.instructor.initials}
              </span>
              <span>
                <span className="block text-[17px] font-semibold">{course.instructor.name}</span>
                <span className="block text-[13px] text-muted">{course.instructor.title}</span>
              </span>
            </div>
          </div>
        </aside>

        {/* Sections */}
        <div className="space-y-12">
          {course.modules.map((m) => {
            const status = moduleStatus(state, course, m);
            const locked = status === "locked";
            const total = m.lessons.reduce((s, l) => s + l.durationSec, 0);
            const lessonsDone = m.lessons.every((l) => state.completedLessons[l.id]);
            const passed = m.quiz ? quizPassed(state, m.quiz.id) : true;
            const open = expanded[m.id] ?? status !== "complete";
            return (
              <section key={m.id} aria-labelledby={`h-${m.id}`}>
                <div className="flex items-end justify-between gap-4 border-b border-line pb-3">
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.1em] text-faint">Module {String(m.position).padStart(2, "0")}</p>
                    <h2 id={`h-${m.id}`} className={`mt-1 text-[24px] font-semibold tracking-[-0.025em] ${locked ? "text-faint" : ""}`}>
                      {m.title}
                    </h2>
                  </div>
                  <StatusChip status={status} />
                </div>
                <div className="mt-3 flex items-center justify-between text-[13px] text-muted">
                  <span>
                    {locked
                      ? `Pass the Module ${m.position - 1} quiz to unlock`
                      : `${m.lessons.length} ${m.lessons.length === 1 ? "lesson" : "lessons"} · ${formatDuration(total)}`}
                  </span>
                  {status === "complete" && (
                    <button onClick={() => setExpanded((e) => ({ ...e, [m.id]: !open }))} className="flex items-center gap-1 text-accent" aria-expanded={open}>
                      {open ? "Hide lessons" : "Show lessons"}
                      <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
                    </button>
                  )}
                </div>

                <AnimatePresence initial={false}>
                {open && (
                <motion.ul
                  className="-mx-3 mt-3 overflow-hidden px-3"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  {m.lessons.map((l, i) => {
                    const done = !!state.completedLessons[l.id];
                    const isNext = step.kind === "lesson" && step.lesson.id === l.id;
                    const row = (
                      <>
                        <LessonThumb
                          module={m}
                          lesson={l}
                          index={i}
                          done={done}
                          current={isNext}
                          progress={(state.positions[l.id] ?? 0) / l.durationSec}
                          className="w-[120px] sm:w-[168px]"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block text-[17px] font-medium leading-snug tracking-[-0.01em]">{l.title}</span>
                          <span className="mt-1 line-clamp-2 hidden text-[14px] text-muted sm:block">{l.summary}</span>
                          <span className="mt-1 block text-[13px] text-faint">{Math.round(l.durationSec / 60)} min</span>
                        </span>
                        <span className="hidden w-6 shrink-0 sm:block">
                          {done ? <Check className="text-success" strokeWidth={2.4} /> : locked ? <Lock size={16} className="text-faint" /> : null}
                        </span>
                      </>
                    );
                    return (
                      <li key={l.id}>
                        {locked ? (
                          <div className="flex items-center gap-4 py-3 opacity-50 sm:gap-5">{row}</div>
                        ) : (
                          <Link href={`/learn/${course.slug}/${l.id}`} className="-mx-3 flex items-center gap-4 rounded-2xl px-3 py-3 transition-colors hover:bg-white sm:gap-5">
                            {row}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                  {m.quiz && (
                    <li>
                      {(() => {
                        const ready = !locked && lessonsDone;
                        const row = (
                          <>
                            <LessonThumb module={m} done={passed} className="w-[120px] sm:w-[168px]" />
                            <span className="min-w-0 flex-1">
                              <span className="block text-[17px] font-medium tracking-[-0.01em]">
                                {m.position === course.modules.length ? "Final assessment" : "Module quiz"}
                              </span>
                              <span className="mt-1 block text-[13px] text-faint">
                                {passed && m.quiz ? "Passed" : `${m.quiz!.questions.length} questions · ${Math.round(m.quiz!.passingScore * 100)}% to pass`}
                              </span>
                            </span>
                            <span className="hidden w-6 shrink-0 sm:block">
                              {passed ? <Check className="text-success" strokeWidth={2.4} /> : !ready ? <Lock size={16} className="text-faint" /> : null}
                            </span>
                          </>
                        );
                        return ready ? (
                          <Link href={`/learn/${course.slug}/quiz/${m.id}`} className="-mx-3 flex items-center gap-4 rounded-2xl px-3 py-3 hover:bg-white sm:gap-5">
                            {row}
                          </Link>
                        ) : (
                          <div className="flex items-center gap-4 py-3 opacity-50 sm:gap-5">{row}</div>
                        );
                      })()}
                    </li>
                  )}
                </motion.ul>
                )}
                </AnimatePresence>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}

function StatusChip({ status }: { status: "complete" | "current" | "locked" }) {
  if (status === "complete")
    return <span className="shrink-0 rounded-full bg-success/10 px-2.5 py-1 text-[12px] font-medium text-success">Complete</span>;
  if (status === "current")
    return <span className="shrink-0 rounded-full bg-accent/10 px-2.5 py-1 text-[12px] font-medium text-accent">In progress</span>;
  return (
    <span className="flex shrink-0 items-center gap-1 rounded-full bg-fill px-2.5 py-1 text-[12px] font-medium text-faint">
      <Lock size={12} /> Locked
    </span>
  );
}
