"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { FadeIn, TextReveal } from "@/components/motion/reveal";
import { formatDuration } from "@/lib/catalog";
import type { Course, Module } from "@/lib/types";

function EpisodeCard({ m, index }: { m: Module; index: number }) {
  const minutes = m.lessons.reduce((s, l) => s + l.durationSec, 0);
  const number = m.kind === "day" ? String(m.position).padStart(2, "0") : m.kind === "welcome" ? "00" : "08";
  return (
    <article className="theme-dark group relative aspect-[4/5] w-[min(360px,78vw,calc((100svh-300px)*0.8))] shrink-0 snap-start overflow-hidden rounded-[28px] bg-surface ring-1 ring-inset ring-white/[0.06]">
      <img
        src={m.still}
        alt=""
        loading={index > 2 ? "lazy" : "eager"}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.4s] ease-(--ease-out-expo) group-hover:scale-[1.06]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/10" />
      <span
        aria-hidden
        className="absolute right-5 top-3 font-[family-name:var(--font-display)] text-[96px] font-extrabold leading-none tracking-[-0.06em] text-transparent [-webkit-text-stroke:1px_rgba(255,255,255,0.35)]"
      >
        {number}
      </span>
      <div className="absolute inset-x-0 bottom-0 p-6">
        <p className="eyebrow">{m.label}</p>
        <h3 className="headline mt-2 text-[24px] text-white">{m.title}</h3>
        <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-ink-2">{m.summary}</p>
        <p className="mt-4 text-[12px] font-medium text-muted">
          {m.lessons.length} {m.lessons.length === 1 ? "video" : "videos"} · {formatDuration(minutes)}
          {m.quiz ? ` · ${m.quiz.questions.length}-question ${m.kind === "wrap" ? "final" : "quiz"}` : ""}
        </p>
      </div>
    </article>
  );
}

/** The curriculum as a filmstrip. On desktop vertical scroll drives it sideways. */
export function Curriculum({ course }: { course: Course }) {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance]);
  const bar = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  useEffect(() => {
    const measure = () => {
      if (!track.current) return;
      const mq = window.matchMedia("(min-width: 768px)").matches;
      setDistance(mq ? Math.max(0, track.current.scrollWidth - window.innerWidth + 64) : 0);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (track.current) ro.observe(track.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const header = (
    <div className="wrap flex flex-col justify-between gap-6 md:flex-row md:items-end">
      <div>
        <p className="eyebrow">What&apos;s inside</p>
        <TextReveal text="Seven days. One clear path." className="display mt-4 text-[clamp(40px,6.5vw,88px)] text-white" />
      </div>
      <FadeIn delay={0.2}>
        <p className="max-w-[34ch] text-[17px] leading-relaxed text-ink-2">
          An introduction, a short run of focused videos each day, and a conclusion. Pass each day&apos;s quiz to unlock the next.
        </p>
      </FadeIn>
    </div>
  );

  return (
    <section id="curriculum" ref={section} className="relative bg-black md:h-[300vh]" style={{ scrollMarginTop: 0 }}>
      <div className="py-24 md:sticky md:top-0 md:flex md:h-[100svh] md:flex-col md:justify-center md:py-0">
        {header}
        {/* Desktop: scroll-driven track */}
        <motion.div ref={track} style={{ x }} className="mt-12 hidden gap-5 pl-[max(32px,calc((100vw-1200px)/2+32px))] md:flex">
          {course.modules.map((m, i) => (
            <EpisodeCard key={m.id} m={m} index={i} />
          ))}
        </motion.div>
        {/* Mobile: native swipe */}
        <div className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 [scrollbar-width:none] md:hidden" data-lenis-prevent>
          {course.modules.map((m, i) => (
            <EpisodeCard key={m.id} m={m} index={i} />
          ))}
        </div>
        <div className="wrap mt-10 hidden md:block">
          <div className="h-px w-full bg-white/10">
            <motion.div className="h-px bg-amber" style={{ width: bar }} />
          </div>
        </div>
      </div>
    </section>
  );
}
