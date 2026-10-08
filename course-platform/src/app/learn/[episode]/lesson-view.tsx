"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState, ViewTransition } from "react";
import { CheckDraw } from "@/components/celebrate";
import { Check, ChevronLeft, ChevronRight, Lock } from "@/components/icons";
import { EpisodeThumb } from "@/components/learn/episode-thumb";
import { Notes } from "@/components/learn/notes";
import { Player } from "@/components/learn/player";
import { FadeIn } from "@/components/motion/reveal";
import { course, formatDuration, getEpisode } from "@/lib/catalog";
import { demo, useDemo } from "@/lib/demo-store";
import { moduleStatus, moduleUnlocked, quizPassed } from "@/lib/progress";

const EASE = [0.16, 1, 0.3, 1] as const;

export function LessonView({ slug }: { slug: string }) {
  const state = useDemo();
  const ep = getEpisode(slug)!;
  const lesson = ep.lessons[0];
  const index = course.modules.indexOf(ep);
  const next = course.modules[index + 1];
  const prev = course.modules[index - 1];
  const done = !!state.completedLessons[lesson.id];
  const quiz = ep.quiz;
  const passed = quiz ? quizPassed(state, quiz.id) : true;
  const [moment, setMoment] = useState(false);

  if (!moduleUnlocked(state, course, ep)) {
    return (
      <div className="wrap flex min-h-dvh flex-col items-center justify-center text-center">
        <div className="grid size-16 place-items-center rounded-full bg-white/[0.06] text-muted ring-1 ring-inset ring-white/10">
          <Lock size={24} />
        </div>
        <h1 className="headline mt-6 text-[30px] text-white">Not yet.</h1>
        <p className="mt-3 max-w-sm text-[16px] leading-relaxed text-muted">
          Finish {prev.label}{prev.quiz ? " and pass its quiz" : ""} to unlock {ep.label}.
        </p>
        <Link href="/learn" className="btn btn-white mt-8">Back to your path</Link>
      </div>
    );
  }

  function complete() {
    demo.completeLesson(lesson.id);
    setMoment(true);
  }

  const nextAction =
    quiz && !passed
      ? { href: `/learn/${ep.slug}/quiz`, label: ep.kind === "wrap" ? "Take the final assessment" : `Take the ${ep.label} quiz` }
      : next
        ? { href: `/learn/${next.slug}`, label: `Next: ${next.label}` }
        : { href: "/learn/complete", label: "Claim your certificate" };

  const overlay = moment ? (
    <motion.div
      key="moment"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 grid place-items-center bg-black/75 p-6 backdrop-blur-md"
    >
      <div className="max-w-sm text-center">
        <div className="flex justify-center">
          <CheckDraw size={60} color="var(--amber)" />
        </div>
        <p className="mt-4 text-[13px] font-medium text-white/60">{ep.label} lesson complete</p>
        <p className="headline mt-1 text-[clamp(24px,3vw,32px)] text-white">{quiz && !passed ? "Now, prove it." : next ? `Up next: ${next.label}` : "That's the course."}</p>
        {quiz && !passed && (
          <p className="mt-2 text-[15px] text-white/70">
            {quiz.questions.length} questions · about {Math.max(2, Math.round(quiz.questions.length / 2))} minutes
          </p>
        )}
        <div className="mt-7 flex justify-center gap-3">
          <Link href={nextAction.href} transitionTypes={["nav-forward"]} className="btn btn-white">
            {quiz && !passed ? "Start the quiz" : "Continue"}
          </Link>
          <button onClick={() => setMoment(false)} className="btn btn-ghost">Stay</button>
        </div>
      </div>
    </motion.div>
  ) : null;

  return (
    <div className="mx-auto max-w-[1320px] pb-32 pt-14 sm:px-6 sm:pt-20 lg:pb-20">
      <div className="hidden px-0 pb-4 sm:block">
        <Link href="/learn" transitionTypes={["nav-back"]} className="inline-flex items-center gap-1 text-[14px] text-muted hover:text-white">
          <ChevronLeft size={16} /> All lessons
        </Link>
      </div>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-10">
        <div className="min-w-0">
          <ViewTransition name={`ep-${ep.slug}`} share="morph" default="none">
            <div>
              <Player
                episode={ep}
                lesson={lesson}
                startAt={state.positions[lesson.id] ?? 0}
                watermark={`Licensed to ${state.user?.name} · ${state.user?.email}`}
                onProgress={(s) => demo.savePosition(lesson.id, s)}
                onEnded={complete}
                overlay={overlay}
              />
            </div>
          </ViewTransition>

          <div className="px-5 sm:px-0">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE, delay: 0.15 }} className="mt-8 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="eyebrow">
                  {ep.label} · {formatDuration(lesson.durationSec)}
                </p>
                <h1 className="headline mt-3 max-w-[22ch] text-[clamp(30px,3.6vw,46px)] text-white">{ep.title}</h1>
              </div>
              <div className="hidden shrink-0 items-center gap-3 lg:flex">
                {done ? (
                  <span className="btn bg-amber/15 text-amber">
                    <Check size={18} strokeWidth={2.6} /> Completed
                  </span>
                ) : (
                  <button onClick={complete} className="btn btn-glass">Mark as complete</button>
                )}
                {done && (
                  <Link href={nextAction.href} transitionTypes={["nav-forward"]} className="btn btn-white">
                    {nextAction.label} <ChevronRight size={18} />
                  </Link>
                )}
              </div>
            </motion.div>

            <div className="hairline mt-10" />
            <div className="mt-10">
              <Notes notes={lesson.notes} />
            </div>
          </div>
        </div>

        {/* Course list */}
        <aside className="px-5 sm:px-0 lg:sticky lg:top-20 lg:self-start">
          {quiz && (
            <FadeIn y={12}>
              <div className={`mb-4 rounded-[24px] p-5 ring-1 ring-inset ${passed ? "bg-amber/[0.08] ring-amber/25" : "bg-surface ring-white/[0.06]"}`}>
                <p className="eyebrow">{ep.kind === "wrap" ? "Final assessment" : `${ep.label} quiz`}</p>
                <p className="mt-2 text-[16px] font-semibold text-white">
                  {passed ? "Passed" : `${quiz.questions.length} questions · ${Math.round(quiz.passingScore * 100)}% to pass`}
                </p>
                <p className="mt-1 text-[13px] text-muted">{passed ? `${next ? `${next.label} is unlocked.` : "Your certificate is ready."}` : done ? "Ready when you are." : "Opens when you finish the lesson."}</p>
                {done && !passed && (
                  <Link href={`/learn/${ep.slug}/quiz`} transitionTypes={["nav-forward"]} className="btn btn-white mt-4 w-full">
                    Start the quiz
                  </Link>
                )}
              </div>
            </FadeIn>
          )}
          <div className="panel overflow-hidden" data-lenis-prevent>
            <p className="px-5 pb-2 pt-5 text-[13px] font-semibold text-muted">THE PROD · {course.modules.length} lessons</p>
            <ol className="max-h-[56vh] overflow-y-auto px-2 pb-2">
              {course.modules.map((m) => {
                const s = moduleStatus(state, course, m);
                const current = m.slug === ep.slug;
                const row = (
                  <>
                    <EpisodeThumb episode={m} state={s} morph={false} className="w-24 shrink-0 !rounded-[10px]" />
                    <span className="min-w-0 flex-1">
                      <span className={`block text-[11px] font-bold uppercase tracking-[0.16em] ${current ? "text-amber" : "text-faint"}`}>{current ? "Now playing" : m.label}</span>
                      <span className="mt-0.5 line-clamp-2 block text-[14px] font-medium leading-snug text-white">{m.title}</span>
                    </span>
                  </>
                );
                return (
                  <li key={m.id}>
                    {s === "locked" ? (
                      <div className="flex items-center gap-3 rounded-2xl p-2 opacity-45">{row}</div>
                    ) : (
                      <Link href={`/learn/${m.slug}`} className={`flex items-center gap-3 rounded-2xl p-2 transition-colors ${current ? "bg-white/[0.07]" : "hover:bg-white/[0.04]"}`}>
                        {row}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
        </aside>
      </div>

      {/* Phone action bar */}
      <div className="glass fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t border-white/[0.06] px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 lg:hidden">
        {prev && (
          <Link href={`/learn/${prev.slug}`} transitionTypes={["nav-back"]} className="btn btn-glass size-12 shrink-0 px-0" aria-label="Previous lesson">
            <ChevronLeft />
          </Link>
        )}
        {!done ? (
          <button onClick={complete} className="btn btn-white flex-1">Mark as complete</button>
        ) : (
          <Link href={nextAction.href} transitionTypes={["nav-forward"]} className="btn btn-white flex-1">
            {nextAction.label}
          </Link>
        )}
      </div>
      <ScrollTop slug={slug} />
    </div>
  );
}

/** Lessons open at the top, even when navigated to from far down a page. */
function ScrollTop({ slug }: { slug: string }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);
  return null;
}
