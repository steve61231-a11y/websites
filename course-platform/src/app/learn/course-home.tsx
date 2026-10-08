"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { Award, Check, Lock, Play } from "@/components/icons";
import { EpisodeThumb } from "@/components/learn/episode-thumb";
import { FadeIn, TextReveal } from "@/components/motion/reveal";
import { brand, course, formatDuration } from "@/lib/catalog";
import { useDemo } from "@/lib/demo-store";
import { courseComplete, courseProgress, moduleStatus, nextStep, quizPassed } from "@/lib/progress";

const EASE = [0.16, 1, 0.3, 1] as const;

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export function CourseHome() {
  const state = useDemo();
  const step = nextStep(state, course);
  const finished = courseComplete(state, course);
  const pct = Math.round(courseProgress(state, course) * 100);
  const first = state.user?.name.split(" ")[0];
  const cert = state.certificates.find((c) => c.courseId === course.id);
  const lessonsDone = course.modules.filter((m) => m.lessons.every((l) => state.completedLessons[l.id])).length;
  const quizzes = course.modules.filter((m) => m.quiz);
  const passed = quizzes.filter((m) => quizPassed(state, m.quiz!.id)).length;

  const focus = step.kind === "done" ? course.modules[course.modules.length - 1] : step.module;
  const cta =
    step.kind === "lesson"
      ? { href: `/learn/${step.module.slug}`, label: step.started ? "Resume" : "Start the course", icon: true }
      : step.kind === "quiz"
        ? { href: `/learn/${step.module.slug}/quiz`, label: step.module.kind === "wrap" ? "Start the final assessment" : "Take the quiz", icon: false }
        : { href: cert ? `/certificate/${cert.number}` : "/learn/complete", label: "View certificate", icon: false };

  return (
    <>
      {/* Cinematic header: the next thing to do */}
      <section className="relative flex min-h-[78svh] items-end overflow-hidden pt-14">
        <motion.img
          key={focus.still}
          src={focus.still}
          alt=""
          className="absolute inset-0 h-full w-full object-cover md:left-[32%] md:w-[68%]"
          initial={{ scale: 1.12, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 2.2, ease: EASE }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />
        <div className="wrap relative grid gap-10 pb-14 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <FadeIn inView={false} delay={0.2} y={12}>
              <p className="eyebrow">
                {finished ? "Course complete" : `${greeting()}, ${first}`}
              </p>
            </FadeIn>
            <TextReveal
              as="h1"
              inView={false}
              delay={0.3}
              text={finished ? "You did it." : step.kind === "quiz" ? (focus.kind === "wrap" ? "Final assessment" : `${focus.label} quiz`) : focus.label}
              className="display mt-4 text-[clamp(56px,9vw,120px)] text-white"
            />
            <FadeIn inView={false} delay={0.6} y={12}>
              <p className="headline mt-3 max-w-[22ch] text-[clamp(22px,2.6vw,32px)] text-white">
                {finished ? "Your certificate is ready." : focus.title}
              </p>
              <p className="mt-3 text-[14px] text-muted">
                {step.kind === "lesson"
                  ? `${formatDuration(step.lesson.durationSec)} · ${step.started ? "Pick up where you left off" : "Your first lesson"}`
                  : step.kind === "quiz"
                    ? `${focus.quiz!.questions.length} questions · ${focus.kind === "wrap" ? "unlocks your certificate" : "unlocks the next day"}`
                    : cert?.number}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={cta.href} className="btn btn-white btn-lg">
                  {cta.icon && <Play size={16} />} {cta.label}
                </Link>
                <a href="#path" className="btn btn-glass btn-lg">Course outline</a>
              </div>
            </FadeIn>
          </div>

          {/* Progress */}
          <FadeIn inView={false} delay={0.8} y={12} className="md:text-right">
            <p className="font-[family-name:var(--font-display)] text-[72px] font-extrabold leading-none tracking-[-0.05em] text-white">
              {pct}
              <span className="text-[28px] text-muted">%</span>
            </p>
            <div className="mt-4 flex gap-1 md:justify-end" aria-label={`${lessonsDone} of ${course.modules.length} lessons complete`}>
              {course.modules.map((m, i) => {
                const s = moduleStatus(state, course, m);
                return (
                  <motion.span
                    key={m.id}
                    className={`h-1.5 w-7 rounded-full ${s === "complete" ? "bg-amber" : s === "current" ? "bg-white" : "bg-white/15"}`}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1, opacity: s === "current" ? [1, 0.45, 1] : 1 }}
                    transition={{ delay: 0.9 + i * 0.05, duration: 0.6, opacity: { duration: 2, repeat: Infinity } }}
                    style={{ originX: 0 }}
                  />
                );
              })}
            </div>
            <p className="mt-3 text-[13px] text-muted">
              {lessonsDone} of {course.modules.length} lessons · {passed} of {quizzes.length} quizzes
            </p>
          </FadeIn>
        </div>
      </section>

      {/* The path */}
      <div id="path" className="wrap mt-16 grid scroll-mt-20 gap-12 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section>
          <h2 className="display text-[clamp(32px,4vw,48px)] text-white">Your path</h2>
          <ol className="mt-8 space-y-2">
            {course.modules.map((m, i) => (
              <EpisodeRow key={m.id} index={i} />
            ))}
          </ol>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <FadeIn>
            <div className="panel p-6">
              <div className="flex items-center gap-3">
                <span className={`grid size-11 place-items-center rounded-full ${finished ? "bg-amber text-black" : "bg-white/[0.06] text-muted"}`}>
                  <Award size={20} />
                </span>
                <div>
                  <p className="text-[16px] font-semibold text-white">Certificate</p>
                  <p className="text-[13px] text-muted">{finished ? "Earned" : `${quizzes.length - passed} quizzes to go`}</p>
                </div>
              </div>
              {finished && (
                <Link href={cert ? `/certificate/${cert.number}` : "/learn/complete"} className="btn btn-amber mt-5 w-full">
                  View certificate
                </Link>
              )}
            </div>
          </FadeIn>
          <FadeIn delay={0.05}>
            <CommunityCard />
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="panel flex items-center gap-4 p-6">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#2c2c2e] to-black font-[family-name:var(--font-display)] text-[15px] font-bold text-white ring-1 ring-white/10">
                {course.instructor.initials}
              </span>
              <div>
                <p className="text-[16px] font-semibold text-white">{course.instructor.name}</p>
                <p className="text-[13px] text-muted">{course.instructor.title}</p>
              </div>
            </div>
          </FadeIn>
        </aside>
      </div>
    </>
  );
}

function EpisodeRow({ index }: { index: number }) {
  const state = useDemo();
  const m = course.modules[index];
  const status = moduleStatus(state, course, m);
  const locked = status === "locked";
  const lesson = m.lessons[0];
  const watched = (state.positions[lesson.id] ?? 0) / lesson.durationSec;
  const lessonDone = !!state.completedLessons[lesson.id];
  const quiz = m.quiz;
  const quizDone = quiz ? quizPassed(state, quiz.id) : false;
  const best = quiz ? Math.max(0, ...(state.quizAttempts[quiz.id] ?? []).map((a) => a.score)) : 0;
  const prev = course.modules[index - 1];

  const inner = (
    <>
      <EpisodeThumb episode={m} state={status} progress={watched} className="w-[132px] shrink-0 sm:w-[200px]" />
      <div className="min-w-0 flex-1">
        <p className={`font-[family-name:var(--font-display)] text-[11px] font-bold uppercase tracking-[0.2em] ${status === "current" ? "text-amber" : "text-faint"}`}>
          {m.label}
          {status === "current" && " · Up next"}
        </p>
        <p className="mt-1.5 text-[17px] font-semibold leading-snug tracking-[-0.01em] text-white sm:text-[20px]">{m.title}</p>
        <p className="mt-1.5 hidden text-[14px] leading-relaxed text-muted sm:line-clamp-2">{m.summary}</p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[12px] text-muted">
          <span>{formatDuration(lesson.durationSec)}</span>
          {quiz && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 ${
                quizDone ? "bg-amber/15 text-amber" : lessonDone && !locked ? "bg-white text-black" : "bg-white/[0.06]"
              }`}
            >
              {quizDone ? <Check size={12} strokeWidth={3} /> : null}
              {quizDone ? `Quiz ${best}/${quiz.questions.length}` : `${m.kind === "wrap" ? "Final" : "Quiz"} · ${quiz.questions.length} questions`}
            </span>
          )}
          {locked && prev && (
            <span className="inline-flex items-center gap-1">
              <Lock size={12} /> Pass {prev.label} {prev.quiz ? "quiz" : ""} to unlock
            </span>
          )}
        </div>
      </div>
    </>
  );

  return (
    <motion.li
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.7, ease: EASE, delay: Math.min(index, 4) * 0.04 }}
    >
      {locked ? (
        <div className="flex items-center gap-4 rounded-[22px] p-2.5 opacity-60 sm:gap-6">{inner}</div>
      ) : (
        <Link
          href={lessonDone && quiz && !quizDone ? `/learn/${m.slug}/quiz` : `/learn/${m.slug}`}
          transitionTypes={["nav-forward"]}
          className={`group flex items-center gap-4 rounded-[22px] p-2.5 transition-colors duration-300 sm:gap-6 ${
            status === "current" ? "bg-white/[0.05] ring-1 ring-inset ring-white/10" : "hover:bg-white/[0.04]"
          }`}
        >
          {inner}
        </Link>
      )}
    </motion.li>
  );
}

function CommunityCard() {
  const [copied, setCopied] = useState(false);
  return (
    <div className="panel p-6">
      <p className="text-[16px] font-semibold text-white">Join the community</p>
      <p className="mt-1.5 text-[14px] leading-relaxed text-muted">WhatsApp us your number to join THE PROD photographers&apos; group and get support.</p>
      <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-white/[0.05] px-4 py-3 ring-1 ring-inset ring-white/10">
        <span className="select-all text-[15px] font-semibold tabular-nums text-white">{brand.whatsapp}</span>
        <button
          onClick={() => {
            navigator.clipboard
              ?.writeText(brand.whatsapp.replace(/\s/g, ""))
              .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1600);
              })
              .catch(() => {});
          }}
          className="text-[13px] font-semibold text-amber"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}
