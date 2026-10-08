"use client";

import { AnimatePresence, motion, useInView, useScroll, useTransform, type MotionValue } from "motion/react";
import Link from "next/link";
import { useRef, useState } from "react";
import { Check, ChevronDown } from "@/components/icons";
import { Magnetic } from "@/components/motion/magnetic";
import { FadeIn, TextReveal } from "@/components/motion/reveal";
import { brand, course, courseStats, formatPrice } from "@/lib/catalog";

/* ---------- How we help: a statement that lights up as you read ---------- */

function Word({ word, progress, range }: { word: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.14, 1]);
  return (
    <motion.span style={{ opacity }} className="mr-[0.22em] inline-block">
      {word}
    </motion.span>
  );
}

function ScrubText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.45"] });
  const words = text.split(" ");
  return (
    <p ref={ref} className={className} aria-label={text}>
      {words.map((w, i) => (
        <Word key={i} word={w} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]} />
      ))}
    </p>
  );
}

function Tile({ title, body, index }: { title: string; body: string; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <FadeIn delay={index * 0.08}>
      <div
        ref={ref}
        onPointerMove={(e) => {
          const r = ref.current!.getBoundingClientRect();
          ref.current!.style.setProperty("--mx", `${e.clientX - r.left}px`);
          ref.current!.style.setProperty("--my", `${e.clientY - r.top}px`);
        }}
        className="group relative h-full overflow-hidden rounded-[28px] bg-surface p-8 ring-1 ring-inset ring-white/[0.06] transition-colors duration-500 hover:ring-white/[0.12] sm:p-10"
      >
        {/* Spotlight that follows the cursor */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{ background: "radial-gradient(420px circle at var(--mx) var(--my), rgba(245,165,36,0.14), transparent 60%)" }}
        />
        <p className="font-[family-name:var(--font-display)] text-[13px] font-bold tabular-nums tracking-[0.2em] text-amber">0{index + 1}</p>
        <h3 className="headline mt-10 text-[28px] text-white sm:text-[32px]">{title}</h3>
        <p className="mt-3 max-w-[34ch] text-[16px] leading-relaxed text-ink-2">{body}</p>
      </div>
    </FadeIn>
  );
}

export function HowWeHelp() {
  return (
    <section className="relative bg-black py-28 sm:py-40">
      <div className="wrap">
        <p className="eyebrow">How we help</p>
        <ScrubText
          text="Learn the creative business skills, content strategies, brand positioning and tools you need to attract more customers, turn them into clients, and keep them."
          className="headline mt-6 max-w-[22ch] text-[clamp(32px,5.2vw,72px)] text-white"
        />
        <div className="mt-20 grid gap-4 sm:grid-cols-2">
          {course.outcomes.map((o, i) => (
            <Tile key={o.title} title={o.title} body={o.body} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Instructor ---------- */

export function Instructor() {
  const { instructor } = course;
  const names = [...instructor.clients, ...instructor.clients];
  const strip = useRef<HTMLDivElement>(null);
  const stripInView = useInView(strip);
  return (
    <section id="instructor" className="relative overflow-hidden bg-black py-28 sm:py-40">
      <div className="wrap grid items-center gap-14 md:grid-cols-[0.9fr_1.1fr]">
        <FadeIn>
          <div className="relative aspect-[4/5] overflow-hidden rounded-[32px] ring-1 ring-inset ring-white/[0.06]">
            <img src="/stills/day-5.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-8">
              <p className="font-[family-name:var(--font-display)] text-[64px] font-extrabold leading-none tracking-[-0.05em] text-white">7+</p>
              <p className="mt-2 text-[15px] text-ink-2">years creating product visuals for brands across East Africa</p>
            </div>
          </div>
        </FadeIn>
        <div>
          <p className="eyebrow">Your instructor</p>
          <TextReveal text={instructor.name} className="display mt-4 text-[clamp(48px,7vw,96px)] text-white" />
          <FadeIn delay={0.15}>
            <p className="mt-3 text-[15px] font-medium text-muted">{instructor.title}</p>
            <blockquote className="headline mt-8 max-w-[26ch] text-[clamp(22px,2.4vw,30px)] text-white">
              &ldquo;We help brands stand out with visuals that connect and convert.&rdquo;
            </blockquote>
            <p className="mt-6 max-w-[48ch] text-[17px] leading-relaxed text-ink-2">
              {instructor.bio} He recently led the Lamborghini Wines East Africa product launch, and is building online classes and
              creative centres across Africa.
            </p>
          </FadeIn>
        </div>
      </div>

      {/* Clients marquee */}
      <div className="relative mt-24 [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <p className="wrap mb-6 text-[12px] font-medium uppercase tracking-[0.24em] text-faint">Trusted by</p>
        <div
          ref={strip}
          className="flex w-max animate-[marquee_38s_linear_infinite] gap-14 hover:[animation-play-state:paused]"
          style={{ animationPlayState: stripInView ? "running" : "paused" }}
        >
          {names.map((n, i) => (
            <span
              key={i}
              className="whitespace-nowrap font-[family-name:var(--font-display)] text-[clamp(22px,3vw,38px)] font-extrabold uppercase tracking-[-0.02em] text-white/25 transition-colors duration-300 hover:text-white"
            >
              {n}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Pricing ---------- */

export function Pricing() {
  const stats = courseStats(course);
  const card = useRef<HTMLDivElement>(null);
  const cardInView = useInView(card);
  const included = [
    `${stats.lessons} video lessons: a welcome, 7 days and a wrap-up`,
    `${stats.quizzes} quizzes, so you know each day has landed`,
    "Lesson notes, gear lists and setups for every surface",
    "The THE PROD WhatsApp community and support line",
    "A verifiable certificate when you finish",
    "Lifetime access, on phone, tablet and laptop",
  ];
  return (
    <section id="pricing" className="relative bg-black py-28 sm:py-40">
      <div className="wrap">
        <div className="text-center">
          <p className="eyebrow">Get access</p>
          <TextReveal text="One payment. Yours for life." className="display mx-auto mt-4 max-w-[14ch] text-[clamp(40px,6vw,84px)] text-white" />
        </div>

        <FadeIn delay={0.1}>
          <div ref={card} className="relative mx-auto mt-16 max-w-[560px] rounded-[34px] p-px">
            {/* Slowly rotating light along the edge */}
            <div className="absolute inset-0 overflow-hidden rounded-[34px]" aria-hidden>
              <motion.div
                className="absolute -inset-[60%] bg-[conic-gradient(from_0deg,transparent_0deg,rgba(245,165,36,0.9)_40deg,transparent_90deg,transparent_360deg)]"
                animate={cardInView ? { rotate: 360 } : undefined}
                transition={{ duration: 9, repeat: Infinity, ease: "linear" }}
              />
            </div>
            <div className="relative rounded-[33px] bg-[#0d0d0f] p-8 sm:p-12">
              <p className="font-[family-name:var(--font-display)] text-[13px] font-bold uppercase tracking-[0.2em] text-ink-2">{course.shortTitle}</p>
              <p className="mt-1 text-[15px] text-muted">{course.title}</p>
              <p className="mt-8 font-[family-name:var(--font-display)] text-[clamp(48px,8vw,72px)] font-extrabold leading-none tracking-[-0.04em] text-white">
                {formatPrice(course.price, course.currency)}
              </p>
              <p className="mt-2 text-[14px] text-muted">M-Pesa or card · instant access</p>
              <ul className="mt-9 space-y-4">
                {included.map((t) => (
                  <li key={t} className="flex gap-3 text-[15px] leading-snug text-ink-2">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-amber/15 text-amber">
                      <Check size={13} strokeWidth={3} />
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
              <div className="mt-10 flex flex-col gap-3">
                <Magnetic className="w-full" strength={0.12}>
                  <Link href="/enroll" className="btn btn-amber btn-lg w-full">Access the course</Link>
                </Magnetic>
                <a href={brand.bookingUrl} className="btn btn-glass btn-lg w-full">Book a 1:1 session</a>
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/* ---------- FAQ ---------- */

const FAQS = [
  { q: "Do I need an expensive camera?", a: "No. Day 2 covers what to buy on a budget and when to upgrade. Light matters more than the camera, and the course shows you how to get the most from what you have." },
  { q: "Is it really seven days?", a: "It's seven focused days of short videos, plus a welcome and a wrap-up. Go faster or slower; your progress is saved and you can pick up where you left off on any device." },
  { q: "How long do I have access?", a: "For life. Pay once and come back to any lesson whenever you need it." },
  { q: "Do I get a certificate?", a: "Yes. Pass the final assessment and your certificate is issued instantly, emailed to you, and verifiable by anyone with its ID." },
  { q: "How do I get help?", a: "Join the THE PROD WhatsApp community to share work and ask questions, and message the support line if you're stuck." },
  { q: "How do I pay?", a: "Securely through Paystack with M-Pesa or card. Your access arrives by email as soon as the payment is confirmed." },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="relative bg-black py-28 sm:py-36">
      <div className="wrap grid gap-12 md:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="eyebrow">Questions</p>
          <TextReveal text="Good to know." className="display mt-4 text-[clamp(40px,5vw,72px)] text-white" />
        </div>
        <ul className="border-t border-line">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <li key={f.q} className="border-b border-line">
                <button onClick={() => setOpen(isOpen ? null : i)} className="flex w-full items-center justify-between gap-6 py-6 text-left" aria-expanded={isOpen}>
                  <span className="text-[19px] font-semibold tracking-[-0.01em] text-white">{f.q}</span>
                  <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }} className="text-muted">
                    <ChevronDown />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="max-w-[56ch] pb-6 text-[16px] leading-relaxed text-ink-2">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ---------- Closing call to action ---------- */

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-black py-32 sm:py-48">
      <div aria-hidden className="absolute left-1/2 top-1/2 size-[1100px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(194,106,18,0.32)_0%,rgba(194,106,18,0.12)_35%,transparent_65%)]" />
      <div className="wrap relative text-center">
        <TextReveal text="Your next product shot starts today." className="display mx-auto max-w-[16ch] text-[clamp(44px,7vw,104px)] text-white" />
        <FadeIn delay={0.3}>
          <div className="mt-12 flex justify-center">
            <Magnetic>
              <Link href="/enroll" className="btn btn-white btn-lg">
                Access the course · {formatPrice(course.price, course.currency)}
              </Link>
            </Magnetic>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
