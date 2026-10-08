"use client";

import { AnimatePresence, motion, useScroll, useTransform } from "motion/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Wordmark } from "@/components/brand/wordmark";
import { Magnetic } from "@/components/motion/magnetic";
import { FadeIn, TextReveal } from "@/components/motion/reveal";
import type { Surface } from "@/components/studio/studio-scene";
import { brand, course, formatPrice } from "@/lib/catalog";

const Studio = dynamic(() => import("@/components/studio/studio-scene"), { ssr: false });

const SURFACES: { key: Surface; name: string; line: string; body: string; setup: string; examples: string }[] = [
  {
    key: "matte",
    name: "Matte",
    line: "Absorbs the light.",
    body: "No shine, no reflections. One soft key light at 45° and a white card are all it needs.",
    setup: "1 light",
    examples: "Bags · ceramics · wood · clay",
  },
  {
    key: "reflective",
    name: "Reflective",
    line: "Mirrors the room.",
    body: "Chrome and glass show everything around them, including you. You don't light the product, you light what it sees.",
    setup: "2 lights",
    examples: "Watches · jewellery · steel",
  },
  {
    key: "transparent",
    name: "Transparent",
    line: "Light passes straight through.",
    body: "Clear glass is drawn by its edges. A back light and two strips turn an invisible bottle into a crisp outline.",
    setup: "3 lights",
    examples: "Perfume · glassware · clear bottles",
  },
  {
    key: "translucent",
    name: "Translucent",
    line: "Glows from within.",
    body: "Frosted glass, soap and wax scatter light. Light them from behind and they glow.",
    setup: "3 lights",
    examples: "Candles · soap · frosted glass",
  },
];

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

export function StudioStory() {
  const mobile = useIsMobile();
  const [active, setActive] = useState(-1); // -1 = hero
  const [ready, setReady] = useState(false);
  // ?still shows the rendered poster only (also the path for devices without WebGL).
  // Server and client both render no canvas markup, so this can't mismatch.
  const [live] = useState(() => {
    if (typeof window === "undefined") return true;
    const noGL = !document.createElement("canvas").getContext("webgl2");
    return !noGL && !new URLSearchParams(window.location.search).has("still");
  });
  const blocks = useRef<(HTMLElement | null)[]>([]);
  const hero = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({ target: hero, offset: ["start start", "end start"] });
  const heroY = useTransform(heroProgress, [0, 1], ["0%", "-18%"]);
  const heroOpacity = useTransform(heroProgress, [0, 0.7], [1, 0]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    if (hero.current) io.observe(hero.current);
    blocks.current.forEach((b) => b && io.observe(b));
    return () => io.disconnect();
  }, []);

  const surface: Surface = active < 0 ? "transparent" : SURFACES[active].key;
  const offsetX = mobile ? 0 : active < 0 ? 1.7 : 1.55;

  return (
    <section className="relative bg-black" aria-label="Introduction">
      {/* Pinned studio */}
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* Poster paints instantly and stays as the fallback */}
        <motion.img
          src="/stills/hero.jpg"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
          animate={{ opacity: ready ? 0 : 1 }}
          transition={{ duration: 1.2 }}
        />
        {live && <Studio
          surface={surface}
          offsetX={offsetX}
          reflections={!mobile}
          cameraZ={mobile ? 8.6 : 7.6}
          onReady={() => setReady(true)}
          className="absolute inset-0 h-full w-full"
        />}
        {/* Shade for legible text */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black via-black/10 to-black/40 md:bg-gradient-to-r md:from-black/85 md:via-black/30 md:to-transparent" />
        <div className="grain pointer-events-none absolute inset-0" />

        {/* Surface progress */}
        <AnimatePresence>
          {active >= 0 && (
            <motion.div
              className="absolute bottom-[max(28px,env(safe-area-inset-bottom))] right-5 flex items-center gap-3 sm:right-8"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
            >
              <span className="font-[family-name:var(--font-display)] text-[12px] font-bold tabular-nums tracking-[0.2em] text-white">
                0{active + 1}
                <span className="text-faint"> / 04</span>
              </span>
              <span className="flex gap-1">
                {SURFACES.map((s, i) => (
                  <span key={s.key} className="h-[3px] w-6 overflow-hidden rounded-full bg-white/15">
                    <motion.span className="block h-full bg-amber" animate={{ width: i <= active ? "100%" : "0%" }} transition={{ duration: 0.6 }} />
                  </span>
                ))}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Scrolling content over the studio */}
      <div className="relative z-10 -mt-[100svh]">
        {/* Hero */}
        <div ref={hero} data-index={-1} className="relative h-[100svh] min-h-[640px]">
          <motion.div style={{ y: heroY, opacity: heroOpacity }} className="wrap flex h-full flex-col justify-end pb-24 pt-28 md:justify-center md:pb-0">
            <div className="max-w-[640px]">
              <FadeIn inView={false} delay={0.1} y={12}>
                <p className="eyebrow">{brand.organisation} presents</p>
              </FadeIn>
              <h1 className="mt-5 text-white">
                <span className="sr-only">THE PROD: {brand.subtitle}</span>
                <Wordmark animate delay={0.25} className="w-[min(86vw,560px)]" />
              </h1>
              <FadeIn inView={false} delay={1.1} y={12}>
                <p className="mt-5 font-[family-name:var(--font-display)] text-[12px] font-semibold uppercase tracking-[0.28em] text-ink-2 sm:text-[13px]">
                  {brand.subtitle}
                </p>
              </FadeIn>
              <TextReveal
                as="p"
                inView={false}
                delay={1.25}
                stagger={0.025}
                text={course.tagline}
                className="headline mt-7 max-w-[24ch] text-[clamp(24px,3.2vw,36px)] text-white"
              />
              <FadeIn inView={false} delay={1.9} y={16}>
                <div className="mt-9 flex flex-wrap items-center gap-3">
                  <Magnetic>
                    <Link href="/enroll" className="btn btn-white btn-lg">
                      Access the course
                    </Link>
                  </Magnetic>
                  <Link href="/#course" className="btn btn-glass btn-lg">
                    See the 7 days
                  </Link>
                </div>
                <p className="mt-4 text-[13px] text-muted">{formatPrice(course.price, course.currency)} · Lifetime access · Certificate</p>
              </FadeIn>
            </div>
          </motion.div>
          {/* Scroll cue */}
          <motion.div
            style={{ opacity: heroOpacity }}
            className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 md:flex"
            aria-hidden
          >
            <span className="text-[11px] font-medium uppercase tracking-[0.3em] text-faint">Scroll</span>
            <span className="relative h-10 w-px overflow-hidden bg-white/15">
              <motion.span
                className="absolute inset-x-0 top-0 h-1/2 bg-white"
                animate={{ y: ["-100%", "200%"] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              />
            </span>
          </motion.div>
        </div>

        {/* Intro to the surfaces */}
        <div className="wrap flex min-h-[70svh] items-center">
          <div className="max-w-[560px]">
            <p className="eyebrow">Day 1 · Understanding surfaces</p>
            <TextReveal
              text="Every product breaks the light differently."
              className="headline mt-5 text-[clamp(34px,5vw,64px)] text-white"
            />
            <FadeIn delay={0.2}>
              <p className="mt-6 max-w-[42ch] text-[18px] leading-relaxed text-ink-2">
                Before you touch a light, know what you&apos;re lighting. Scroll to change the bottle.
              </p>
            </FadeIn>
          </div>
        </div>

        {SURFACES.map((s, i) => (
          <article
            key={s.key}
            ref={(el) => {
              blocks.current[i] = el;
            }}
            data-index={i}
            className="wrap flex min-h-[100svh] items-end pb-28 md:items-center md:pb-0"
          >
            <div className="max-w-[560px]">
              <FadeIn>
                <p className="font-[family-name:var(--font-display)] text-[13px] font-bold tabular-nums tracking-[0.24em] text-amber">
                  0{i + 1} · {s.setup}
                </p>
              </FadeIn>
              <TextReveal as="h3" text={s.name} className="display mt-4 text-[clamp(56px,10vw,132px)] text-white" />
              <FadeIn delay={0.15}>
                <p className="headline mt-5 text-[clamp(22px,2.6vw,32px)] text-white">{s.line}</p>
                <p className="mt-4 max-w-[40ch] text-[17px] leading-relaxed text-ink-2">{s.body}</p>
                <p className="mt-6 inline-flex rounded-full bg-white/[0.07] px-4 py-2 text-[13px] text-ink-2 ring-1 ring-inset ring-white/10 backdrop-blur-md">
                  {s.examples}
                </p>
              </FadeIn>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
