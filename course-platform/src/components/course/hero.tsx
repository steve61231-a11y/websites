"use client";

import { AnimatePresence, motion } from "motion/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore, ViewTransition } from "react";
import { Wordmark } from "@/components/brand/wordmark";
import { Magnetic } from "@/components/motion/magnetic";
import { FadeIn, TextReveal } from "@/components/motion/reveal";
import type { Surface } from "@/components/studio/studio-scene";
import { brand, courseStats, formatDuration, formatPrice } from "@/lib/catalog";
import { useDemo } from "@/lib/demo-store";
import type { Course } from "@/lib/types";

const Studio = dynamic(() => import("@/components/studio/studio-scene"), { ssr: false });

// The four surfaces from Day 1, shown one after another on the live studio.
const SURFACES: { key: Surface; name: string; line: string }[] = [
  { key: "transparent", name: "Transparent", line: "Light passes straight through." },
  { key: "reflective", name: "Reflective", line: "Mirrors the room." },
  { key: "matte", name: "Matte", line: "Absorbs the light." },
  { key: "translucent", name: "Translucent", line: "Glows from within." },
];

const noop = () => () => {};
let liveCache: boolean | undefined;
function canRenderLive() {
  if (liveCache === undefined) {
    const gl = !!document.createElement("canvas").getContext("webgl2");
    liveCache = gl && !new URLSearchParams(window.location.search).has("still");
  }
  return liveCache;
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const on = () => setMobile(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return mobile;
}

/** One screen: the course, its price, and a live studio cycling through surfaces. */
export function CourseHero({ course }: { course: Course }) {
  const mobile = useIsMobile();
  const { enrolled } = useDemo();
  const owned = enrolled.includes(course.id);
  const stats = courseStats(course);
  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  // ?still shows the rendered poster only (also the path without WebGL).
  const live = useSyncExternalStore(noop, canRenderLive, () => true);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % SURFACES.length), 4200);
    return () => clearInterval(t);
  }, [paused]);

  const surface = SURFACES[index];

  return (
    <section className="theme-dark relative min-h-[100svh] overflow-hidden bg-black" aria-label={course.title}>
      {/* The catalog card's cover morphs into this layer */}
      <ViewTransition name={`cover-${course.slug}`} share="morph" default="none">
        <div className="absolute inset-0">
          <motion.picture aria-hidden className="absolute inset-0 block md:translate-x-[18%]" animate={{ opacity: ready ? 0 : 1 }} transition={{ duration: 1.2 }}>
            <source media="(max-width: 767px)" srcSet="/stills/hero-portrait.jpg" />
            <img src="/stills/hero.jpg" alt="" className="h-full w-full object-cover" />
          </motion.picture>
          {live && (
            <Studio
              surface={surface.key}
              offsetX={mobile ? 0 : 1.7}
              reflections={!mobile}
              cameraZ={mobile ? 12 : 7.6}
              liftY={mobile ? 1 : 0}
              onReady={() => setReady(true)}
              className="absolute inset-0 h-full w-full"
            />
          )}
        </div>
      </ViewTransition>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/10 to-black/40 md:bg-gradient-to-r md:from-black/85 md:via-black/30 md:to-transparent" />
      <div className="grain pointer-events-none absolute inset-0" />

      <div className="wrap relative flex min-h-[100svh] flex-col justify-end pb-[max(40px,env(safe-area-inset-bottom))] pt-28 md:justify-center md:pb-16">
        <div className="max-w-[640px]">
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
            <Wordmark animate delay={0.1} className="w-[min(80vw,520px)]" />
          </h1>
          <FadeIn inView={false} delay={0.4} y={10}>
            <p className="mt-5 font-[family-name:var(--font-display)] text-[12px] font-semibold uppercase tracking-[0.28em] text-ink-2 sm:text-[13px]">
              {course.title}
            </p>
          </FadeIn>
          <TextReveal
            as="p"
            inView={false}
            delay={0.45}
            stagger={0.02}
            text={course.tagline}
            className="headline mt-6 max-w-[24ch] text-[clamp(22px,3vw,34px)] text-white"
          />
          <FadeIn inView={false} delay={0.65} y={12}>
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

        {/* Surface switcher: the live studio's caption, and a way to drive it */}
        <FadeIn inView={false} delay={0.8} y={10} className="mt-10 md:absolute md:bottom-12 md:right-8 md:mt-0 md:w-[300px]">
          <div className="min-h-[52px]">
            <AnimatePresence mode="wait">
              <motion.p
                key={surface.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4 }}
                className="text-[15px] text-ink-2"
              >
                <span className="font-semibold text-white">{surface.name}.</span> {surface.line}
              </motion.p>
            </AnimatePresence>
          </div>
          <div className="mt-3 flex gap-1.5" role="tablist" aria-label="Product surfaces">
            {SURFACES.map((s, i) => (
              <button
                key={s.key}
                role="tab"
                aria-selected={i === index}
                aria-label={s.name}
                onClick={() => {
                  setIndex(i);
                  setPaused(true);
                }}
                className="group relative h-6 flex-1"
              >
                <span className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-white/20">
                  {i === index && (
                    <motion.span
                      key={`${s.key}-${paused}`}
                      className="absolute inset-y-0 left-0 bg-amber"
                      initial={{ width: paused ? "100%" : "0%" }}
                      animate={{ width: "100%" }}
                      transition={{ duration: paused ? 0 : 4.2, ease: "linear" }}
                    />
                  )}
                </span>
              </button>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
