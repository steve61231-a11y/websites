"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckDraw } from "@/components/celebrate";
import { Check, ChevronLeft, ChevronRight, Close, Doc, Download, List, Lock } from "@/components/icons";
import { Player } from "@/components/player";
import { findLesson } from "@/lib/catalog";
import { demo, useDemo } from "@/lib/demo-store";
import { lessonAfter, lessonBefore, moduleLessonsComplete, moduleStatus, moduleUnlocked, quizPassed } from "@/lib/progress";
import type { Course } from "@/lib/types";

export function LessonView({ course, lessonId }: { course: Course; lessonId: string }) {
  const state = useDemo();
  const router = useRouter();
  const { module, lesson, index } = findLesson(course, lessonId)!;
  const [tab, setTab] = useState<"overview" | "transcript" | "resources">("overview");
  const [outline, setOutline] = useState(false);
  const [moment, setMoment] = useState(false);
  const done = !!state.completedLessons[lesson.id];
  const next = lessonAfter(course, lesson.id);
  const prev = lessonBefore(course, lesson.id);
  const nextInModule = next && next.module.id === module.id ? next : undefined;
  const quizHref = `/learn/${course.slug}/quiz/${module.id}`;
  const unlocked = moduleUnlocked(state, course, module);

  function complete() {
    demo.completeLesson(lesson.id);
    setMoment(true);
  }

  if (!unlocked) {
    const prevModule = course.modules[course.modules.indexOf(module) - 1];
    return (
      <div className="wrap flex min-h-dvh flex-col items-center justify-center text-center">
        <div className="grid size-16 place-items-center rounded-full bg-fill text-muted">
          <Lock size={26} />
        </div>
        <h1 className="mt-6 text-[28px] font-semibold tracking-[-0.02em]">Not quite yet.</h1>
        <p className="mt-2 max-w-sm text-[17px] text-muted">
          Finish Module {prevModule.position}, {prevModule.title}, and pass its quiz to unlock this lesson.
        </p>
        <Link href={`/learn/${course.slug}`} className="btn btn-primary mt-8">Back to your path</Link>
      </div>
    );
  }

  const lessonsDoneNow = moduleLessonsComplete(state, module);
  const needsQuiz = !!module.quiz && !quizPassed(state, module.quiz.id);

  const overlay = moment ? (
    <motion.div
      key="moment"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 grid place-items-center bg-black/70 p-6 backdrop-blur-md"
    >
      {lessonsDoneNow && needsQuiz ? (
        <QuizPrompt position={module.position} count={module.quiz!.questions.length} href={quizHref} onReplay={() => setMoment(false)} />
      ) : nextInModule ? (
        <UpNext
          title={nextInModule.lesson.title}
          href={`/learn/${course.slug}/${nextInModule.lesson.id}`}
          onCancel={() => setMoment(false)}
        />
      ) : (
        <div className="text-center text-white">
          <CheckDraw size={56} />
          <p className="mt-4 text-[22px] font-semibold">Lesson complete</p>
          <Link href={`/learn/${course.slug}`} className="btn btn-light mt-6">Back to your path</Link>
        </div>
      )}
    </motion.div>
  ) : null;

  return (
    <>
      {/* Top bar */}
      <header className="glass sticky top-0 z-40 border-b border-black/[0.06]">
        <div className="mx-auto flex h-12 max-w-[1180px] items-center gap-3 px-3 sm:px-6">
          <Link href={`/learn/${course.slug}`} className="flex items-center gap-0.5 rounded-full py-1 pr-2 text-[14px] text-accent">
            <ChevronLeft size={18} /> Path
          </Link>
          <p className="min-w-0 flex-1 truncate text-center text-[13px] text-muted">
            <span className="font-medium text-ink">Module {module.position}</span> · {module.title}
          </p>
          <button onClick={() => setOutline(true)} className="flex items-center gap-1.5 rounded-full px-2 py-1 text-[14px] text-accent">
            <List size={18} /> <span className="hidden sm:inline">Lessons</span>
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] pb-32 sm:px-6 sm:pt-6">
        <div className="mx-auto sm:max-w-[calc((100dvh-180px)*16/9)]">
        <Player
          key={lesson.id}
          lesson={lesson}
          moduleTitle={`Module ${module.position} · ${module.title}`}
          startAt={state.positions[lesson.id] ?? 0}
          watermark={`Licensed to ${state.user?.name} · ${state.user?.email}`}
          onProgress={(s) => demo.savePosition(lesson.id, s)}
          onEnded={complete}
          overlay={overlay}
        />
        </div>

        <div className="px-5 sm:px-0">
          {/* Module lesson ticks */}
          <div className="mt-6 flex gap-1.5" aria-label="Lessons in this module">
            {module.lessons.map((l) => (
              <Link
                key={l.id}
                href={`/learn/${course.slug}/${l.id}`}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  state.completedLessons[l.id] ? "bg-success" : l.id === lesson.id ? "bg-accent" : "bg-line"
                }`}
                aria-label={l.title}
              />
            ))}
            {module.quiz && (
              <span className={`h-1 w-8 rounded-full ${quizPassed(state, module.quiz.id) ? "bg-success" : "bg-line"}`} />
            )}
          </div>

          <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[13px] font-medium text-muted">
                Lesson {index + 1} of {module.lessons.length}
              </p>
              <h1 className="mt-1 text-[clamp(26px,3.6vw,40px)] font-semibold leading-tight tracking-[-0.03em]">{lesson.title}</h1>
            </div>
            <div className="hidden shrink-0 items-center gap-3 lg:flex">
              <CompleteButton done={done} onComplete={complete} />
              <NextButton course={course} next={nextInModule?.lesson.id} quiz={lessonsDoneNow && needsQuiz ? quizHref : undefined} crossModule={next?.lesson.id} />
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-8 inline-flex rounded-full bg-fill p-1 text-[13px] font-medium" role="tablist">
            {(["overview", "transcript", "resources"] as const).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`relative rounded-full px-4 py-1.5 capitalize transition-colors ${tab === t ? "text-ink" : "text-muted"}`}
              >
                {tab === t && <motion.span layoutId="tab" className="absolute inset-0 rounded-full bg-white shadow-sm" />}
                <span className="relative">{t}</span>
              </button>
            ))}
          </div>

          <div className="mt-6 max-w-[68ch] text-[17px] leading-[1.6] text-ink-2">
            {tab === "overview" && (
              <div>
                <p>{lesson.summary}</p>
                <p className="mt-6 text-[14px] text-muted">
                  {Math.round(lesson.durationSec / 60)} min · Part of {course.title}
                </p>
              </div>
            )}
            {tab === "transcript" && (
              <div className="space-y-4">
                {lesson.transcript.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            )}
            {tab === "resources" &&
              (lesson.resources?.length ? (
                <ul className="space-y-2">
                  {lesson.resources.map((r) => (
                    <li key={r.title} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                      <span className="grid size-10 place-items-center rounded-xl bg-fill text-muted">
                        <Doc size={18} />
                      </span>
                      <span className="flex-1">
                        <span className="block text-[15px] font-medium text-ink">{r.title}</span>
                        <span className="text-[13px] text-muted">{r.kind}</span>
                      </span>
                      <Download size={18} className="text-accent" />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted">No downloads for this lesson. Everything you need is in the video.</p>
              ))}
          </div>
        </div>
      </main>

      {/* Mobile action bar */}
      <div className="glass fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t border-black/[0.06] px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] lg:hidden">
        {prev ? (
          <Link href={`/learn/${course.slug}/${prev.lesson.id}`} className="btn btn-quiet size-12 shrink-0 px-0" aria-label="Previous lesson">
            <ChevronLeft />
          </Link>
        ) : null}
        <div className="flex flex-1 gap-2 [&>*]:flex-1">
          {!done ? (
            <CompleteButton done={done} onComplete={complete} />
          ) : (
            <NextButton course={course} next={nextInModule?.lesson.id} quiz={lessonsDoneNow && needsQuiz ? quizHref : undefined} crossModule={next?.lesson.id} />
          )}
        </div>
      </div>

      <Outline course={course} currentId={lesson.id} open={outline} onClose={() => setOutline(false)} onPick={(href) => { setOutline(false); router.push(href); }} />
    </>
  );
}

function CompleteButton({ done, onComplete }: { done: boolean; onComplete: () => void }) {
  return done ? (
    <span className="btn bg-success/10 text-success">
      <Check size={18} strokeWidth={2.4} /> Completed
    </span>
  ) : (
    <button onClick={onComplete} className="btn btn-dark">
      Mark as complete
    </button>
  );
}

function NextButton({ course, next, quiz, crossModule }: { course: Course; next?: string; quiz?: string; crossModule?: string }) {
  if (quiz)
    return (
      <Link href={quiz} className="btn btn-primary">
        Take the quiz <ChevronRight size={18} />
      </Link>
    );
  const target = next ?? crossModule;
  if (!target) return <Link href={`/learn/${course.slug}`} className="btn btn-primary">Back to path</Link>;
  return (
    <Link href={`/learn/${course.slug}/${target}`} className="btn btn-primary">
      Next lesson <ChevronRight size={18} />
    </Link>
  );
}

function UpNext({ title, href, onCancel }: { title: string; href: string; onCancel: () => void }) {
  const router = useRouter();
  const [left, setLeft] = useState(6);
  useEffect(() => {
    if (left <= 0) {
      router.push(href);
      return;
    }
    const t = setTimeout(() => setLeft((l) => l - 1), 1000);
    return () => clearTimeout(t);
  }, [left, href, router]);

  return (
    <div className="w-full max-w-sm text-center text-white">
      <div className="flex justify-center"><CheckDraw size={52} /></div>
      <p className="mt-3 text-[15px] text-white/70">Lesson complete</p>
      <motion.div
        initial={{ y: 16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-5 rounded-2xl bg-white/10 p-4 text-left backdrop-blur-xl sm:mt-7 sm:p-5"
      >
        <p className="text-[12px] font-medium text-white/60">Up next</p>
        <p className="mt-0.5 text-[17px] font-semibold sm:text-[19px]">{title}</p>
        <div className="mt-4 flex items-center gap-3">
          <button onClick={() => router.push(href)} className="btn btn-light min-h-10 flex-1">
            Play now
            <span className="relative size-5">
              <svg viewBox="0 0 20 20" className="absolute inset-0 -rotate-90">
                <circle cx="10" cy="10" r="8" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="2.5" />
                <motion.circle
                  cx="10" cy="10" r="8" fill="none" stroke="var(--ink)" strokeWidth="2.5"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 6, ease: "linear" }}
                />
              </svg>
            </span>
          </button>
          <button onClick={onCancel} className="btn min-h-10 text-white/80 hover:bg-white/10">Stay</button>
        </div>
      </motion.div>
    </div>
  );
}

function QuizPrompt({ position, count, href, onReplay }: { position: number; count: number; href: string; onReplay: () => void }) {
  return (
    <div className="max-w-sm text-center text-white">
      <div className="flex justify-center"><CheckDraw size={56} /></div>
      <p className="mt-4 text-[13px] font-medium text-white/60">Every lesson in Module {position}, done.</p>
      <p className="mt-1 text-[24px] font-semibold tracking-[-0.02em] sm:text-[28px]">Now, prove it.</p>
      <p className="mt-1 text-[15px] text-white/70">{count} questions. About {Math.max(2, Math.round(count / 2))} minutes.</p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href={href} className="btn btn-primary">Take the quiz</Link>
        <button onClick={onReplay} className="btn text-white/80 hover:bg-white/10">Not yet</button>
      </div>
    </div>
  );
}

function Outline({
  course,
  currentId,
  open,
  onClose,
  onPick,
}: {
  course: Course;
  currentId: string;
  open: boolean;
  onClose: () => void;
  onPick: (href: string) => void;
}) {
  const state = useDemo();
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" onClick={onClose} />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="absolute inset-y-0 right-0 flex w-full max-w-[400px] flex-col bg-bg shadow-2xl"
          >
            <div className="flex h-14 items-center justify-between border-b border-line px-5">
              <p className="text-[17px] font-semibold">Lessons</p>
              <button onClick={onClose} className="grid size-9 place-items-center rounded-full bg-fill" aria-label="Close">
                <Close size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              {course.modules.map((m) => {
                const status = moduleStatus(state, course, m);
                const locked = status === "locked";
                return (
                  <div key={m.id} className="mb-5">
                    <p className="flex items-center gap-2 px-2 text-[12px] font-medium text-faint">
                      Module {m.position} {status === "complete" && <Check size={14} className="text-success" />}
                      {locked && <Lock size={12} />}
                    </p>
                    <p className={`px-2 text-[15px] font-semibold ${locked ? "text-faint" : ""}`}>{m.title}</p>
                    {!locked && (
                      <ul className="mt-1.5">
                        {m.lessons.map((l) => {
                          const current = l.id === currentId;
                          const doneL = !!state.completedLessons[l.id];
                          return (
                            <li key={l.id}>
                              <button
                                onClick={() => onPick(`/learn/${course.slug}/${l.id}`)}
                                className={`flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-[14px] ${current ? "bg-accent/10 text-accent" : "hover:bg-fill"}`}
                              >
                                <span className={`grid size-5 shrink-0 place-items-center rounded-full ${doneL ? "bg-success text-white" : current ? "border-2 border-accent" : "border border-line"}`}>
                                  {doneL && <Check size={12} strokeWidth={3} />}
                                </span>
                                <span className="flex-1">{l.title}</span>
                                <span className="text-[12px] text-faint">{Math.round(l.durationSec / 60)}m</span>
                              </button>
                            </li>
                          );
                        })}
                        {m.quiz && (
                          <li>
                            <button
                              disabled={!moduleLessonsComplete(state, m)}
                              onClick={() => onPick(`/learn/${course.slug}/quiz/${m.id}`)}
                              className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left text-[14px] hover:bg-fill disabled:opacity-50"
                            >
                              <Doc size={18} className={quizPassed(state, m.quiz.id) ? "text-success" : "text-faint"} />
                              <span className="flex-1">Quiz</span>
                            </button>
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
