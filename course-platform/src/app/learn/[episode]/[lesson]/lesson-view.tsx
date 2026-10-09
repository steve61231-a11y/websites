"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState, ViewTransition, type ReactNode } from "react";
import { CheckDraw } from "@/components/celebrate";
import { Check, ChevronLeft, ChevronRight, Download, Lock } from "@/components/icons";
import { EpisodeThumb } from "@/components/learn/episode-thumb";
import { Notes } from "@/components/learn/notes";
import { Player } from "@/components/learn/player";
import { FadeIn } from "@/components/motion/reveal";
import { course, formatDuration, getLesson, lessonLabel } from "@/lib/catalog";
import { demo, useDemo } from "@/lib/demo-store";
import { moduleLessonsComplete, moduleUnlocked, quizPassed } from "@/lib/progress";
import type { Resource } from "@/lib/types";

const EASE = [0.16, 1, 0.3, 1] as const;

export function LessonView({
  episodeSlug,
  lessonSlug,
  transcript,
}: {
  episodeSlug: string;
  lessonSlug: string;
  /** Paragraphs of the video transcript, when there is one. */
  transcript?: string[] | null;
}) {
  const state = useDemo();
  const { ep, lesson } = getLesson(episodeSlug, lessonSlug)!;
  const dayIndex = course.modules.indexOf(ep);
  const nextDay = course.modules[dayIndex + 1];
  const prevDay = course.modules[dayIndex - 1];
  const i = ep.lessons.indexOf(lesson);
  const nextInDay = ep.lessons[i + 1];
  const prevInDay = ep.lessons[i - 1];
  const done = !!state.completedLessons[lesson.id];
  const quiz = ep.quiz;
  const passed = quiz ? quizPassed(state, quiz.id) : true;
  const dayDone = moduleLessonsComplete(state, ep);
  const [moment, setMoment] = useState(false);
  const label = lessonLabel(lesson.code, ep.kind);

  if (!moduleUnlocked(state, course, ep)) {
    return (
      <div className="wrap flex min-h-dvh flex-col items-center justify-center text-center">
        <div className="grid size-16 place-items-center rounded-full bg-white/[0.06] text-muted ring-1 ring-inset ring-white/10">
          <Lock size={24} />
        </div>
        <h1 className="headline mt-6 text-[30px] text-white">Not yet.</h1>
        <p className="mt-3 max-w-sm text-[16px] leading-relaxed text-muted">
          Finish {prevDay.label}{prevDay.quiz ? " and pass its quiz" : ""} to unlock {ep.label}.
        </p>
        <Link href="/learn" className="btn btn-white mt-8">Back to your path</Link>
      </div>
    );
  }

  function complete() {
    demo.completeLesson(lesson.id);
    setMoment(true);
  }

  // What comes after this video: the next one today, then the day's quiz, then the next day.
  const lessonHref = (slug: string, l: { slug: string }) => `/learn/${slug}/${l.slug}`;
  const next =
    nextInDay
      ? { href: lessonHref(ep.slug, nextInDay), label: `Next: ${lessonLabel(nextInDay.code, ep.kind)} ${nextInDay.title}`, short: "Next video" }
      : quiz && !passed
        ? { href: `/learn/${ep.slug}/quiz`, label: ep.kind === "wrap" ? "Take the final assessment" : `Take the ${ep.label} quiz`, short: "Start the quiz" }
        : nextDay
          ? { href: lessonHref(nextDay.slug, nextDay.lessons[0]), label: `Start ${nextDay.label}`, short: `Start ${nextDay.label}` }
          : { href: "/learn/complete", label: "Claim your certificate", short: "Claim certificate" };

  const overlay = moment ? (
    <motion.div key="moment" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-20 grid place-items-center bg-black/75 p-6 backdrop-blur-md">
      <div className="max-w-sm text-center">
        <div className="flex justify-center">
          <CheckDraw size={56} color="var(--amber)" />
        </div>
        <p className="mt-4 text-[13px] font-medium text-white/60">{label} complete</p>
        <p className="headline mt-1 text-[clamp(22px,3vw,30px)] text-white">
          {nextInDay ? `Up next: ${nextInDay.title}` : quiz && !passed ? `That's ${ep.label}. Now, prove it.` : nextDay ? `${nextDay.label} is next.` : "That's the course."}
        </p>
        <div className="mt-7 flex justify-center gap-3">
          <Link href={next.href} transitionTypes={["nav-forward"]} className="btn btn-white">{next.short}</Link>
          <button onClick={() => setMoment(false)} className="btn btn-ghost">Stay</button>
        </div>
      </div>
    </motion.div>
  ) : null;

  return (
    <div className="mx-auto max-w-[1320px] pb-32 pt-14 sm:px-6 sm:pt-20 lg:pb-20">
      <div className="hidden pb-4 sm:block">
        <Link href="/learn" transitionTypes={["nav-back"]} className="inline-flex items-center gap-1 text-[14px] text-muted hover:text-white">
          <ChevronLeft size={16} /> Course
        </Link>
      </div>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0">
          <ViewTransition name={`ls-${lesson.id}`} share="morph" default="none">
            <div>
              <Player
                key={lesson.id}
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
            <motion.div key={lesson.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE, delay: 0.1 }} className="mt-8 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="eyebrow">
                  {ep.label} · {ep.kind === "day" ? `${label} · ` : ""}
                  {formatDuration(lesson.durationSec)}
                </p>
                <h1 className="headline mt-3 max-w-[22ch] text-[clamp(30px,3.6vw,46px)] text-white">{lesson.title}</h1>
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
                  <Link href={next.href} transitionTypes={["nav-forward"]} className="btn btn-white">
                    {next.short} <ChevronRight size={18} />
                  </Link>
                )}
              </div>
            </motion.div>

            <LessonTabs
              notes={
                <>
                  <Notes notes={lesson.notes} />
                  {lesson.resources?.length ? <Downloads items={lesson.resources} /> : null}
                </>
              }
              transcript={transcript}
            />
          </div>
        </div>

        {/* This day's lessons */}
        <aside className="px-5 sm:px-0 lg:sticky lg:top-20 lg:self-start">
          <div className="panel overflow-hidden" data-lenis-prevent>
            <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-5">
              <div className="min-w-0">
                <p className="eyebrow">{ep.label}</p>
                <p className="mt-1 truncate text-[17px] font-semibold text-white">{ep.title}</p>
                <p className="text-[12px] text-muted">
                  {ep.lessons.length} {ep.lessons.length === 1 ? "video" : "videos"} · {ep.lessons.filter((l) => state.completedLessons[l.id]).length} done
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                {prevDay && moduleUnlocked(state, course, prevDay) ? (
                  <Link href={`/learn/${prevDay.slug}/${prevDay.lessons[0].slug}`} aria-label={prevDay.label} className="grid size-8 place-items-center rounded-full bg-white/[0.07] text-ink-2 hover:bg-white/[0.12]">
                    <ChevronLeft size={16} />
                  </Link>
                ) : (
                  <span className="grid size-8 place-items-center rounded-full bg-white/[0.03] text-faint"><ChevronLeft size={16} /></span>
                )}
                {nextDay && moduleUnlocked(state, course, nextDay) ? (
                  <Link href={`/learn/${nextDay.slug}/${nextDay.lessons[0].slug}`} aria-label={nextDay.label} className="grid size-8 place-items-center rounded-full bg-white/[0.07] text-ink-2 hover:bg-white/[0.12]">
                    <ChevronRight size={16} />
                  </Link>
                ) : (
                  <span className="grid size-8 place-items-center rounded-full bg-white/[0.03] text-faint"><ChevronRight size={16} /></span>
                )}
              </div>
            </div>
            <div className="mx-5 flex gap-1" aria-hidden>
              {ep.lessons.map((l) => (
                <span key={l.id} className={`h-1 flex-1 rounded-full ${state.completedLessons[l.id] ? "bg-amber" : l.id === lesson.id ? "bg-white" : "bg-white/12"}`} />
              ))}
            </div>
            <ol className="max-h-[52vh] overflow-y-auto p-2">
              {ep.lessons.map((l, k) => {
                const current = l.id === lesson.id;
                const ldone = !!state.completedLessons[l.id];
                return (
                  <li key={l.id}>
                    <Link
                      href={`/learn/${ep.slug}/${l.slug}`}
                      transitionTypes={[k > i ? "nav-forward" : "nav-back"]}
                      className={`flex items-center gap-3 rounded-2xl p-2 transition-[background-color,transform] duration-200 active:scale-[0.98] ${current ? "bg-white/[0.07]" : "hover:bg-white/[0.04]"}`}
                    >
                      <EpisodeThumb episode={ep} image={l.thumb} code={ep.kind === "wrap" ? "" : l.code} state={ldone ? "complete" : undefined} progress={(state.positions[l.id] ?? 0) / l.durationSec} morph={false} className="w-[92px] shrink-0 !rounded-[10px]" />
                      <span className="min-w-0 flex-1">
                        <span className={`block text-[11px] font-bold uppercase tracking-[0.16em] ${current ? "text-amber" : "text-faint"}`}>
                          {current ? "Now playing" : `${lessonLabel(l.code, ep.kind)} · ${Math.round(l.durationSec / 60)} min`}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-[14px] font-medium leading-snug text-white">{l.title}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
            {quiz && (
              <div className="border-t border-white/[0.06] p-4">
                {passed ? (
                  <p className="flex items-center gap-2 text-[14px] font-semibold text-amber">
                    <Check size={16} strokeWidth={3} /> {ep.kind === "wrap" ? "Final assessment passed" : `${ep.label} quiz passed`}
                  </p>
                ) : dayDone ? (
                  <Link href={`/learn/${ep.slug}/quiz`} transitionTypes={["nav-forward"]} className="btn btn-white w-full">
                    {ep.kind === "wrap" ? "Take the final assessment" : `Take the ${ep.label} quiz`}
                  </Link>
                ) : (
                  <p className="flex items-center gap-2 text-[13px] text-muted">
                    <Lock size={14} /> {ep.kind === "wrap" ? "Final assessment" : `${ep.label} quiz`} opens after the last video
                  </p>
                )}
              </div>
            )}
          </div>
          <FadeIn y={10}>
            <Link href="/learn#path" className="mt-3 block text-center text-[13px] text-muted hover:text-white">See the whole course</Link>
          </FadeIn>
        </aside>
      </div>

      {/* Phone action bar */}
      <div className="glass fixed inset-x-0 bottom-0 z-40 flex items-center gap-2 border-t border-white/[0.06] px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 lg:hidden">
        {prevInDay && (
          <Link href={`/learn/${ep.slug}/${prevInDay.slug}`} transitionTypes={["nav-back"]} className="btn btn-glass size-12 shrink-0 px-0" aria-label="Previous lesson">
            <ChevronLeft />
          </Link>
        )}
        {!done ? (
          <button onClick={complete} className="btn btn-white flex-1">Mark as complete</button>
        ) : (
          <Link href={next.href} transitionTypes={["nav-forward"]} className="btn btn-white flex-1">{next.short}</Link>
        )}
      </div>
      <ScrollTop id={lesson.id} />
    </div>
  );
}

/** Lessons open at the top, even when reached from far down a page. */
function ScrollTop({ id }: { id: string }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);
  return null;
}

/** Notes and transcript, one at a time, under a segmented switch. */
function LessonTabs({ notes, transcript }: { notes: ReactNode; transcript?: string[] | null }) {
  const [tab, setTab] = useState<"notes" | "transcript">("notes");
  const tabs = [
    { key: "notes" as const, label: "Notes" },
    ...(transcript?.length ? [{ key: "transcript" as const, label: "Transcript" }] : []),
  ];
  return (
    <div className="mt-10">
      {tabs.length > 1 && (
        <div role="tablist" aria-label="Lesson material" className="inline-flex rounded-full bg-white/[0.06] p-1 ring-1 ring-inset ring-white/10">
          {tabs.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`relative rounded-full px-5 py-2 text-[14px] font-semibold transition-colors ${tab === t.key ? "text-black" : "text-ink-2 hover:text-white"}`}
            >
              {tab === t.key && <motion.span layoutId="lesson-tab" className="absolute inset-0 rounded-full bg-white" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
              <span className="relative">{t.label}</span>
            </button>
          ))}
        </div>
      )}
      <div className="hairline mt-8" />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab}
          role="tabpanel"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="mt-10"
        >
          {tab === "notes" || !transcript ? notes : <Transcript paragraphs={transcript} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function Transcript({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="max-w-[68ch]">
      <p className="text-[13px] text-faint">Transcribed from the video. Small slips in names and numbers are possible; the notes have the corrected details.</p>
      <div className="mt-6 space-y-5 text-[17px] leading-[1.75] text-ink-2">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </div>
  );
}

function Downloads({ items }: { items: Resource[] }) {
  return (
    <div className="mt-14">
      <h3 className="font-[family-name:var(--font-display)] text-[13px] font-bold uppercase tracking-[0.22em] text-amber">Downloads</h3>
      <ul className="mt-5 grid gap-3 sm:grid-cols-2">
        {items.map((r) => (
          <li key={r.href}>
            <a
              href={r.href}
              target="_blank"
              rel="noreferrer"
              download={r.kind !== "Link" ? "" : undefined}
              className="group flex items-center gap-4 rounded-2xl bg-white/[0.05] p-4 ring-1 ring-inset ring-white/10 transition-colors hover:bg-white/[0.08]"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-amber/15 text-amber">
                <Download size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold text-white">{r.title}</span>
                <span className="text-[12px] text-muted">{r.kind}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
