"use client";

import Link from "next/link";
import { Wordmark } from "@/components/brand/wordmark";
import { Magnetic } from "@/components/motion/magnetic";
import { FadeIn, TextReveal } from "@/components/motion/reveal";
import { brand, courseStats, formatDuration, formatPrice } from "@/lib/catalog";
import { useDemo } from "@/lib/demo-store";
import type { Course } from "@/lib/types";
import { Viewfinder } from "./viewfinder";

/** The course in one screen: what you get, what it costs, and the viewfinder that shows what you'll learn. */
export function CourseHero({ course }: { course: Course }) {
  const { enrolled } = useDemo();
  const owned = enrolled.includes(course.id);
  const stats = courseStats(course);

  return (
    <section className="relative overflow-hidden bg-black" aria-label={course.title}>
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-10%] top-[-10%] h-[80%] w-[70%] bg-[radial-gradient(ellipse_at_center,rgba(245,165,36,0.18),transparent_65%)]"
      />
      <div className="wrap relative grid items-center gap-14 pb-24 pt-28 md:min-h-[100svh] md:grid-cols-[minmax(0,1fr)_minmax(0,420px)] md:gap-16 md:pb-20 lg:grid-cols-[minmax(0,1fr)_460px]">
        <div className="min-w-0">
          <FadeIn inView={false} delay={0.05} y={10}>
            <Link href="/#courses" className="text-[13px] font-medium text-muted transition-colors hover:text-white">
              ← All courses
            </Link>
            <p className="eyebrow mt-6">{brand.organisation} presents</p>
          </FadeIn>
          <h1 className="mt-5 text-white">
            <span className="sr-only">
              {course.shortTitle}: {course.title}
            </span>
            <Wordmark animate delay={0.1} className="w-[min(78vw,480px)]" />
          </h1>
          <FadeIn inView={false} delay={0.35} y={10}>
            <p className="mt-5 font-[family-name:var(--font-display)] text-[12px] font-semibold uppercase tracking-[0.28em] text-ink-2 sm:text-[13px]">
              {course.title}
            </p>
          </FadeIn>
          <TextReveal
            as="p"
            inView={false}
            delay={0.4}
            stagger={0.02}
            text={course.tagline}
            className="headline mt-6 max-w-[24ch] text-[clamp(22px,3vw,34px)] text-white"
          />
          <FadeIn inView={false} delay={0.6} y={12}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Magnetic>
                <Link href={owned ? "/learn" : "/enroll"} className="btn btn-white btn-lg">
                  {owned ? "Continue learning" : `Enrol · ${formatPrice(course.price, course.currency)}`}
                </Link>
              </Magnetic>
              <a href="#curriculum" className="btn btn-glass btn-lg">See what&apos;s inside</a>
            </div>
            <p className="mt-4 text-[13px] text-muted">
              {stats.days} days · {stats.lessons} videos · {formatDuration(stats.seconds)} · Lifetime access · Certificate
            </p>
          </FadeIn>
        </div>

        <FadeIn inView={false} delay={0.25} y={24} className="mx-auto w-full max-w-[400px] md:max-w-none">
          <Viewfinder />
        </FadeIn>
      </div>
    </section>
  );
}
