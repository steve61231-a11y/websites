"use client";

import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRef } from "react";
import { Wordmark } from "@/components/brand/wordmark";
import { CheckDraw, Confetti } from "@/components/celebrate";
import { FadeIn, TextReveal } from "@/components/motion/reveal";
import { brand, course, formatPrice } from "@/lib/catalog";
import { useDemo } from "@/lib/demo-store";

const EASE = [0.16, 1, 0.3, 1] as const;

/** The access email, shown the way it will look in the student's inbox. */
function AccessEmail({ first, email }: { first: string; email: string }) {
  const card = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useSpring(useTransform(rx, (v) => v * -6), { stiffness: 140, damping: 18 });
  const rotateY = useSpring(useTransform(ry, (v) => v * 8), { stiffness: 140, damping: 18 });
  const href = `/sign-in?email=${encodeURIComponent(email)}&next=/learn`;

  return (
    <div className="[perspective:1400px]">
      <motion.div
        ref={card}
        onPointerMove={(e) => {
          const r = card.current!.getBoundingClientRect();
          ry.set((e.clientX - r.left) / r.width - 0.5);
          rx.set((e.clientY - r.top) / r.height - 0.5);
        }}
        onPointerLeave={() => {
          rx.set(0);
          ry.set(0);
        }}
        initial={{ opacity: 0, y: 80, rotateX: 28 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1.3, ease: EASE, delay: 0.9 }}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="theme-dark overflow-hidden rounded-[22px] bg-white text-left text-[#111] shadow-[0_60px_120px_-30px_rgba(245,165,36,0.35),0_30px_60px_-30px_rgba(0,0,0,0.9)]"
      >
        {/* Inbox row */}
        <div className="flex items-center gap-3 border-b border-black/[0.07] px-5 py-3.5">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-black text-white">
            <Wordmark className="h-auto w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold">THE PROD</p>
            <p className="truncate text-[12px] text-black/50">Your course access is ready</p>
          </div>
          <span className="text-[12px] text-black/40">now</span>
        </div>
        {/* Email body */}
        <div className="bg-black px-8 py-9 text-white">
          <Wordmark className="h-8 w-auto" />
          <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/60">{brand.subtitle}</p>
        </div>
        <div className="px-8 py-9">
          <p className="text-[24px] font-semibold leading-tight tracking-[-0.02em]">Welcome to THE PROD, {first}.</p>
          <p className="mt-3 text-[15px] leading-relaxed text-black/70">
            Your payment is confirmed and your course is ready. Sign in with <strong className="text-black">{email}</strong>; we&apos;ll send you a one-time code, so there&apos;s no password to remember.
          </p>
          <Link href={href} className="btn mt-7 bg-black text-white hover:bg-black/85">
            Start learning
          </Link>
          <p className="mt-8 border-t border-black/[0.07] pt-5 text-[12px] leading-relaxed text-black/45">
            Receipt · {formatPrice(course.price, course.currency)} · Ref PSK_8F2K19X
            <br />
            {brand.organisation} · {brand.email}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export function Welcome() {
  const params = useSearchParams();
  const { purchaseName, purchaseEmail } = useDemo();
  const email = params.get("email") ?? purchaseEmail ?? "you@example.com";
  const first = (purchaseName ?? "there").split(" ")[0];

  return (
    <div className="relative min-h-dvh overflow-hidden bg-black">
      <Confetti palette="amber" count={70} />
      <div aria-hidden className="absolute left-1/2 top-0 h-[70vh] w-[140vw] -translate-x-1/2 bg-[radial-gradient(ellipse_at_50%_0%,rgba(194,106,18,0.35),transparent_60%)]" />
      <header className="wrap relative flex h-20 items-center">
        <Link href="/" className="text-white" aria-label="THE PROD home">
          <Wordmark className="h-7 w-auto" />
        </Link>
      </header>
      <main className="wrap relative grid items-center gap-14 pb-20 pt-6 lg:grid-cols-[1fr_440px] lg:pt-16">
        <div>
          <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18 }}>
            <CheckDraw size={64} color="var(--amber)" />
          </motion.div>
          <TextReveal as="h1" inView={false} delay={0.15} text={`You're in, ${first}.`} className="display mt-8 text-[clamp(48px,8vw,104px)] text-white" />
          <FadeIn inView={false} delay={0.6}>
            <p className="mt-6 max-w-[34ch] text-[19px] leading-relaxed text-ink-2">
              We&apos;ve sent your access link to <span className="text-white">{email}</span>. Here&apos;s the email. Open it, or start right here.
            </p>
          </FadeIn>
        </div>
        <AccessEmail first={first} email={email} />
      </main>
    </div>
  );
}
