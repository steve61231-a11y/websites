"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

// The course in one loop: a dull snapshot → the settings get dialled in (ISO,
// aperture, shutter, white balance) → click → the shot lands in an online
// store. One image, CSS filters, no WebGL.

type Phase = 0 | 1 | 2 | 3 | 4 | 5 | 6;
// 0 raw · 1 ISO · 2 aperture · 3 shutter + focus · 4 white balance · 5 capture · 6 listed

const SETTINGS = [
  { key: "iso", label: "ISO", from: "3200", to: "100", at: 1 },
  { key: "f", label: "Aperture", from: "f/2.8", to: "f/8", at: 2 },
  { key: "ss", label: "Shutter", from: "1/30", to: "1/125", at: 3 },
  { key: "wb", label: "WB", from: "3200K", to: "5600K", at: 4 },
] as const;

// Same functions in the same order every phase, so they interpolate.
const LOOK: Record<number, string> = {
  0: "blur(7px) brightness(0.5) contrast(0.8) saturate(0.55) sepia(0.45)",
  1: "blur(7px) brightness(0.62) contrast(0.85) saturate(0.6) sepia(0.45)",
  2: "blur(2.5px) brightness(0.72) contrast(0.9) saturate(0.65) sepia(0.45)",
  3: "blur(0px) brightness(1) contrast(1) saturate(0.75) sepia(0.4)",
  4: "blur(0px) brightness(1) contrast(1) saturate(1) sepia(0)",
};

const STEPS = ["Set the shot", "Capture", "Sell it"];
const TIMELINE: [Phase, number][] = [
  [1, 900],
  [2, 1600],
  [3, 2300],
  [4, 3000],
  [5, 3700],
  [6, 4100],
];
const LOOP_MS = 8600;

export function Viewfinder({ image = "/stills/viewfinder.jpg", className = "" }: { image?: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-10% 0px" });
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<Phase>(0);
  const [loop, setLoop] = useState(0);

  // Reduced motion: the finished state, no loop.
  const shown: Phase = reduce ? 6 : phase;

  useEffect(() => {
    if (reduce || !inView) return;
    const timers = TIMELINE.map(([p, t]) => setTimeout(() => setPhase(p), t));
    timers.push(
      setTimeout(() => {
        setPhase(0);
        setLoop((n) => n + 1);
      }, LOOP_MS),
    );
    return () => timers.forEach(clearTimeout);
  }, [loop, inView, reduce]);

  const locked = shown >= 3;
  const step = shown < 5 ? 0 : shown === 5 ? 1 : 2;

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* The camera */}
      <div className="theme-dark relative mx-auto aspect-[4/5] w-full rounded-[30px] bg-[#0c0c0d] p-2 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.08)] ring-1 ring-black/40">
        <div className="relative h-full overflow-hidden rounded-[23px] bg-black">
          <motion.img
            src={image}
            alt="A camera being photographed"
            className="absolute inset-0 h-full w-full object-cover"
            initial={false}
            animate={{ filter: LOOK[Math.min(shown, 4)] }}
            transition={{ duration: shown === 0 ? 0.5 : 0.7, ease: [0.16, 1, 0.3, 1] }}
          />

          {/* Rule-of-thirds grid */}
          <div aria-hidden className="pointer-events-none absolute inset-0 [background:linear-gradient(to_right,transparent_calc(33.33%-0.5px),rgba(255,255,255,0.14)_calc(33.33%-0.5px),rgba(255,255,255,0.14)_calc(33.33%+0.5px),transparent_calc(33.33%+0.5px),transparent_calc(66.66%-0.5px),rgba(255,255,255,0.14)_calc(66.66%-0.5px),rgba(255,255,255,0.14)_calc(66.66%+0.5px),transparent_calc(66.66%+0.5px)),linear-gradient(to_bottom,transparent_calc(33.33%-0.5px),rgba(255,255,255,0.14)_calc(33.33%-0.5px),rgba(255,255,255,0.14)_calc(33.33%+0.5px),transparent_calc(33.33%+0.5px),transparent_calc(66.66%-0.5px),rgba(255,255,255,0.14)_calc(66.66%-0.5px),rgba(255,255,255,0.14)_calc(66.66%+0.5px),transparent_calc(66.66%+0.5px))]" />

          {/* Top bar */}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-3.5 text-[11px] font-semibold tracking-wide text-white/85">
            <span className="rounded-md bg-white/15 px-1.5 py-0.5">M</span>
            <span className="flex items-center gap-2">
              RAW
              <svg width="22" height="11" viewBox="0 0 22 11" aria-hidden>
                <rect x="0.5" y="0.5" width="18" height="10" rx="2.5" fill="none" stroke="currentColor" />
                <rect x="2" y="2" width="12" height="7" rx="1.2" fill="currentColor" />
                <rect x="19.5" y="3.5" width="2" height="4" rx="1" fill="currentColor" />
              </svg>
            </span>
          </div>

          {/* Focus box */}
          <motion.div
            aria-hidden
            className={`absolute left-1/2 top-[46%] size-[22%] -translate-x-1/2 -translate-y-1/2 rounded-[6px] border-2 ${locked ? "border-[#30d158]" : "border-amber"}`}
            animate={locked ? { scale: [1.15, 1], opacity: 1 } : { scale: [1, 1.08, 1], opacity: [1, 0.6, 1] }}
            transition={locked ? { duration: 0.3 } : { duration: 0.9, repeat: Infinity }}
          />

          {/* Settings readout */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-10">
            <div className="grid grid-cols-4 gap-1.5">
              {SETTINGS.map((s) => {
                const done = shown >= s.at;
                const active = shown === s.at;
                return (
                  <div
                    key={s.key}
                    className={`rounded-xl px-2 py-1.5 text-center transition-colors duration-300 ${active ? "bg-amber text-black" : "bg-white/10 text-white"}`}
                  >
                    <p className={`text-[9px] font-semibold uppercase tracking-[0.12em] ${active ? "text-black/70" : "text-white/55"}`}>{s.label}</p>
                    <div className="relative h-[18px] overflow-hidden">
                      <AnimatePresence initial={false} mode="popLayout">
                        <motion.p
                          key={done ? "to" : "from"}
                          initial={{ y: 14, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          exit={{ y: -14, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                          className="text-[13px] font-bold tabular-nums leading-[18px]"
                        >
                          {done ? s.to : s.from}
                        </motion.p>
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shutter flash */}
          <AnimatePresence>
            {shown === 5 && (
              <motion.div
                key={`flash-${loop}`}
                aria-hidden
                className="absolute inset-0 bg-white"
                initial={{ opacity: 0.95 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* The result, live in a store */}
      <AnimatePresence>
        {shown === 6 && (
          <motion.div
            key={`listing-${loop}`}
            initial={{ opacity: 0, y: 30, scale: 0.85, rotate: -4 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotate: -2 }}
            exit={{ opacity: 0, y: 12, scale: 0.95, transition: { duration: 0.25 } }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="theme-dark absolute bottom-[5.5rem] -left-3 w-[56%] max-w-[230px] rounded-[18px] bg-white p-2.5 text-[#111] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.55)] sm:-left-10"
          >
            <p className="mb-1.5 flex items-center gap-1.5 px-0.5 text-[10px] font-semibold text-[#248a3d]">
              <span className="size-1.5 rounded-full bg-[#30d158]" /> Live on your store
            </p>
            <img src={image} alt="" className="aspect-square w-full rounded-[12px] object-cover" />
            <div className="px-0.5 pb-0.5 pt-2">
              <p className="text-[12px] font-semibold leading-tight">Canon EOS 5D · 24–105 mm kit</p>
              <p className="mt-0.5 text-[11px] text-black/50">★★★★★ 128</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-[13px] font-bold">KES 185,000</p>
                <span className="rounded-full bg-black px-2.5 py-1 text-[10px] font-semibold text-white">Add to cart</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* What's happening, in words */}
      <ol className="mt-10 flex justify-center gap-2 text-[12px] font-semibold" aria-label="Set the shot, capture, sell it">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 transition-colors duration-300 ${i === step ? "bg-white text-black" : "bg-white/[0.06] text-muted"}`}
          >
            <span className="tabular-nums opacity-60">{i + 1}</span> {label}
          </li>
        ))}
      </ol>
    </div>
  );
}
