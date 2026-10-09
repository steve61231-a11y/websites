"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { Arrow, Award, Doc, Play } from "@/components/icons";
import { FadeIn, TextReveal } from "@/components/motion/reveal";
import { brand, courses, courseStats, formatDuration, formatPrice } from "@/lib/catalog";
import { useDemo } from "@/lib/demo-store";
import { courseProgress } from "@/lib/progress";
import type { Course } from "@/lib/types";
import { Img } from "@/components/ui/img";

const EASE = [0.16, 1, 0.3, 1] as const;

/** The front door: what this place is, and the courses on offer. */
export function HomeHero() {
  const state = useDemo();
  const mine = courses.find((c) => state.enrolled.includes(c.id));
  const pct = mine ? Math.round(courseProgress(state, mine) * 100) : 0;
  return (
    <section className="relative overflow-hidden pb-14 pt-32 sm:pb-20 sm:pt-40">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[620px] w-[1100px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(245,165,36,0.22),transparent_62%)] blur-2xl"
      />
      <div className="wrap relative">
        <FadeIn inView={false} y={10}>
          <p className="eyebrow">{brand.organisation} · Online school</p>
        </FadeIn>
        <h1 className="display mt-6 text-[clamp(46px,7.4vw,108px)]">
          <TextReveal as="span" inView={false} delay={0.05} text="Learn the craft." className="block text-white" />
          <TextReveal as="span" inView={false} delay={0.18} text="Pick a course." className="block text-white/30" />
        </h1>
        <FadeIn inView={false} delay={0.3} y={10}>
          <p className="mt-8 max-w-[44ch] text-[clamp(17px,1.6vw,20px)] leading-relaxed text-ink-2">
            Short, practical video courses taught by working creatives. Learn at your own pace, pass the quizzes and earn a certificate
            anyone can verify.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            {mine ? (
              <Link href="/learn" className="btn btn-white btn-lg">
                <Play size={16} /> Continue learning · {pct}%
              </Link>
            ) : (
              <a href="#courses" className="btn btn-white btn-lg">Browse courses</a>
            )}
            {!state.user && (
              <Link href="/sign-in" className="btn btn-glass btn-lg">Sign in</Link>
            )}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

export function CourseList() {
  return (
    <section id="courses" className="scroll-mt-24 pb-24 sm:pb-32">
      <div className="wrap">
        <div className="flex items-end justify-between gap-6 border-t border-line pt-10">
          <h2 className="display text-[clamp(30px,4vw,48px)] text-white">Courses</h2>
          <p className="pb-1 text-[14px] text-muted">
            {courses.length} {courses.length === 1 ? "course" : "courses"} · more on the way
          </p>
        </div>
        <ul className="mt-10 grid gap-5">
          {courses.map((c, i) => (
            <CourseCard key={c.id} course={c} index={i} />
          ))}
          <ComingSoon />
        </ul>
      </div>
    </section>
  );
}

function CourseCard({ course, index }: { course: Course; index: number }) {
  const state = useDemo();
  const enrolled = state.enrolled.includes(course.id);
  const stats = courseStats(course);
  const href = enrolled ? "/learn" : `/courses/${course.slug}`;
  return (
    <motion.li
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.9, ease: EASE, delay: index * 0.06 }}
    >
      <Link
        href={href}
        transitionTypes={["nav-forward"]}
        className="group grid overflow-hidden rounded-[32px] bg-surface ring-1 ring-inset ring-white/[0.06] transition-[box-shadow,transform] duration-500 ease-(--ease-out-expo) hover:ring-white/15 active:scale-[0.99] active:duration-150 md:grid-cols-[1.15fr_1fr]"
      >
        <div className="theme-dark relative aspect-[16/10] overflow-hidden bg-black md:aspect-auto md:min-h-[420px]">
          <Img
            src={course.cover}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.6s] ease-(--ease-out-expo) group-hover:scale-[1.04]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <span className="absolute left-5 top-5 rounded-full bg-black/50 px-3 py-1.5 text-[12px] font-semibold text-white ring-1 ring-inset ring-white/15 backdrop-blur-md">
            {course.category}
          </span>
          <p className="absolute bottom-5 left-6 font-[family-name:var(--font-display)] text-[clamp(40px,6vw,72px)] font-extrabold uppercase leading-none tracking-[-0.04em] text-white">
            {course.shortTitle}
          </p>
        </div>

        <div className="flex flex-col p-7 sm:p-10">
          <p className="eyebrow">{enrolled ? "Enrolled" : "New course"}</p>
          <h3 className="headline mt-3 text-[clamp(26px,2.8vw,36px)] text-white">{course.title}</h3>
          <p className="mt-4 max-w-[44ch] text-[16px] leading-relaxed text-ink-2">{course.tagline}</p>

          <dl className="mt-8 grid grid-cols-3 gap-4 border-y border-line py-5">
            <Stat label="Days" value={String(stats.days)} />
            <Stat label="Videos" value={String(stats.lessons)} />
            <Stat label="Watch time" value={formatDuration(stats.seconds)} />
          </dl>

          <ul className="mt-6 space-y-2.5 text-[14px] text-ink-2">
            <li className="flex items-center gap-2.5"><Doc size={16} className="text-amber" /> Notes and a full transcript for every video</li>
            <li className="flex items-center gap-2.5"><Award size={16} className="text-amber" /> {stats.quizzes} quizzes and a verifiable certificate</li>
          </ul>

          <div className="mt-auto flex items-center justify-between gap-4 pt-10">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-white/[0.08] font-[family-name:var(--font-display)] text-[12px] font-bold text-white">
                {course.instructor.initials}
              </span>
              <div className="text-[13px] leading-tight">
                <p className="font-semibold text-white">{course.instructor.name}</p>
                <p className="text-muted">{enrolled ? "Pick up where you left off" : formatPrice(course.price, course.currency)}</p>
              </div>
            </div>
            <span className="btn btn-white min-h-11 px-5 text-[14px]">
              {enrolled ? "Continue" : "View course"}
              <Arrow size={16} className="transition-transform duration-300 group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </Link>
    </motion.li>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[12px] text-muted">{label}</dt>
      <dd className="mt-1 text-[clamp(17px,1.8vw,22px)] font-semibold tracking-[-0.01em] text-white">{value}</dd>
    </div>
  );
}

function ComingSoon() {
  return (
    <motion.li
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.9, ease: EASE, delay: 0.1 }}
      className="flex flex-col items-start justify-between gap-6 rounded-[32px] p-7 ring-1 ring-inset ring-white/10 [background:repeating-linear-gradient(135deg,transparent_0_14px,var(--line)_14px_15px)] sm:flex-row sm:items-center sm:p-10"
    >
      <div>
        <p className="text-[18px] font-semibold text-white">More courses are on the way.</p>
        <p className="mt-1.5 max-w-[48ch] text-[15px] leading-relaxed text-muted">
          Video content creation, creative direction and more from {brand.organisation}. Sign up to any course and you&apos;ll hear first.
        </p>
      </div>
      <a href={`mailto:${brand.email}?subject=Course%20updates`} className="btn btn-glass shrink-0">Keep me posted</a>
    </motion.li>
  );
}

const STEPS = [
  { title: "Choose a course", body: "Pay once with M-Pesa or card. Access arrives by email in seconds." },
  { title: "Learn at your pace", body: "Short videos with notes and transcripts. Your progress is saved on every device." },
  { title: "Prove it", body: "Pass each quiz to unlock the next day, then earn a certificate anyone can verify." },
];

export function HowItWorks() {
  return (
    <section id="how" className="scroll-mt-24 pb-28 sm:pb-40">
      <div className="wrap">
        <div className="border-t border-line pt-10">
          <h2 className="display text-[clamp(30px,4vw,48px)] text-white">How it works</h2>
        </div>
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <FadeIn key={s.title} delay={i * 0.08}>
              <li className="h-full rounded-[28px] bg-surface p-7 ring-1 ring-inset ring-white/[0.06]">
                <span className="font-[family-name:var(--font-display)] text-[13px] font-bold tabular-nums tracking-[0.2em] text-amber">0{i + 1}</span>
                <p className="mt-6 text-[20px] font-semibold tracking-[-0.01em] text-white">{s.title}</p>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{s.body}</p>
              </li>
            </FadeIn>
          ))}
        </ol>
      </div>
    </section>
  );
}
