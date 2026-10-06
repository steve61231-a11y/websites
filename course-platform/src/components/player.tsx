"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { formatClock } from "@/lib/catalog";
import type { Lesson } from "@/lib/types";
import { Back10, Expand, Pause, Play } from "./icons";
import { LensArt } from "./lens-art";

// Demo player. In Phase 4 the <Stage> is replaced by the provider's player
// (Mux / Bunny / Cloudflare Stream) fed a short-lived signed playback token
// from the server. Controls, captions, watermark and progress stay the same.

type Props = {
  lesson: Lesson;
  moduleTitle: string;
  startAt: number;
  watermark: string;
  onProgress: (seconds: number) => void;
  onEnded: () => void;
  overlay?: ReactNode;
};

const RATES = [1, 1.5, 2, 8];

export function Player({ lesson, moduleTitle, startAt, watermark, onProgress, onEnded, overlay }: Props) {
  const duration = lesson.durationSec;
  const [time, setTime] = useState(startAt >= duration - 1 ? 0 : startAt);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [captions, setCaptions] = useState(true);
  const [chrome, setChrome] = useState(true);
  const box = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const ended = useRef(false);
  const lastSaved = useRef(0);

  // Clock
  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const dt = ((now - last) / 1000) * rate;
      last = now;
      setTime((t) => Math.min(duration, t + dt));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, rate, duration]);

  useEffect(() => {
    if (Math.abs(time - lastSaved.current) > 5) {
      lastSaved.current = time;
      onProgress(time);
    }
    if (time >= duration && !ended.current) {
      ended.current = true;
      setPlaying(false);
      onEnded();
    }
  }, [time, duration, onProgress, onEnded]);

  const poke = useCallback(() => {
    setChrome(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setChrome(false), 2600);
  }, []);


  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      if (e.code === "Space" || e.key === "k") {
        e.preventDefault();
        toggle();
      }
      if (e.key === "ArrowLeft") seek(time - 10);
      if (e.key === "ArrowRight") seek(time + 10);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function toggle() {
    if (time >= duration) {
      ended.current = false;
      setTime(0);
    }
    if (playing) clearTimeout(hideTimer.current);
    else poke();
    setPlaying(!playing);
  }

  function seek(t: number) {
    setTime(Math.max(0, Math.min(duration - 0.01, t)));
    ended.current = false;
  }

  const showChrome = chrome || !playing;
  const pct = (time / duration) * 100;
  const caption = lesson.transcript[Math.min(lesson.transcript.length - 1, Math.floor((time / duration) * lesson.transcript.length))];

  return (
    <div
      ref={box}
      onMouseMove={poke}
      onTouchStart={poke}
      className="group relative aspect-video w-full select-none overflow-hidden bg-black sm:rounded-[20px]"
    >
      {/* Stage: stands in for the streamed video */}
      <div className="absolute inset-0" onClick={toggle}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,#1d3557_0%,#000_65%)]" />
        <motion.div
          className="absolute inset-0 grid place-items-center"
          animate={playing ? { scale: [1, 1.08], x: ["0%", "-3%"] } : {}}
          transition={{ duration: 30, repeat: Infinity, repeatType: "mirror", ease: "linear" }}
        >
          <LensArt className="h-[78%] opacity-90" animate={false} aperture={0.3 + Math.round((time / duration) * 12) / 20} />
        </motion.div>
        {!playing && time === 0 && (
          <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 to-transparent p-5 sm:p-7">
            <p className="text-[12px] font-medium text-white/60 sm:text-[13px]">{moduleTitle}</p>
            <p className="text-[17px] font-semibold tracking-[-0.02em] text-white sm:text-[24px]">{lesson.title}</p>
          </div>
        )}
      </div>

      {/* Watermark */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <p className="absolute left-[6%] top-[8%] animate-[drift_48s_ease-in-out_infinite] whitespace-nowrap text-[10px] font-medium text-white/25 sm:text-[12px]">
          {watermark}
        </p>
      </div>

      {/* Captions */}
      <AnimatePresence>
        {captions && time > 0 && (
          <motion.p
            key={caption}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`pointer-events-none absolute inset-x-[8%] mx-auto w-fit max-w-[80%] rounded-lg bg-black/65 px-3 py-1.5 text-center text-[12px] leading-snug text-white transition-[bottom] duration-300 sm:text-[17px] ${
              showChrome ? "bottom-[68px] sm:bottom-[84px]" : "bottom-4 sm:bottom-8"
            }`}
          >
            {caption}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Big play */}
      <AnimatePresence>
        {!playing && !overlay && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            onClick={toggle}
            aria-label="Play"
            className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/20 text-white backdrop-blur-xl transition hover:bg-white/30 sm:size-20"
          >
            <Play size={30} className="ml-1" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Controls */}
      <motion.div
        animate={{ opacity: showChrome && !overlay ? 1 : 0 }}
        className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-4 pb-3 pt-10 sm:px-6 sm:pb-5"
        style={{ pointerEvents: showChrome && !overlay ? "auto" : "none" }}
      >
        <div
          className="group/bar relative h-5 cursor-pointer"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            seek(((e.clientX - r.left) / r.width) * duration);
          }}
          role="slider"
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={duration}
          aria-valuenow={Math.round(time)}
          tabIndex={0}
        >
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/25 transition-[height] group-hover/bar:h-1.5">
            <div className="h-full rounded-full bg-white" style={{ width: `${pct}%` }} />
          </div>
          <div
            className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 shadow transition-opacity group-hover/bar:opacity-100"
            style={{ left: `${pct}%` }}
          />
        </div>
        <div className="mt-1 flex items-center gap-1 text-white sm:gap-3">
          <button onClick={toggle} aria-label={playing ? "Pause" : "Play"} className="grid size-9 place-items-center rounded-full hover:bg-white/10">
            {playing ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button onClick={() => seek(time - 10)} aria-label="Back 10 seconds" className="grid size-9 place-items-center rounded-full hover:bg-white/10">
            <Back10 size={20} />
          </button>
          <span className="ml-1 text-[12px] tabular-nums text-white/80 sm:text-[13px]">
            {formatClock(time)} / {formatClock(duration)}
          </span>
          <span className="flex-1" />
          <button
            onClick={() => setCaptions((c) => !c)}
            className={`rounded-md border px-1.5 text-[11px] font-semibold leading-5 ${captions ? "border-white bg-white text-black" : "border-white/60 text-white/80"}`}
            aria-pressed={captions}
            aria-label="Captions"
          >
            CC
          </button>
          <button
            onClick={() => setRate(RATES[(RATES.indexOf(rate) + 1) % RATES.length])}
            className="min-w-11 rounded-full px-2 py-1 text-[12px] font-semibold tabular-nums hover:bg-white/10"
            aria-label="Playback speed"
            title={rate === 8 ? "Demo speed" : "Playback speed"}
          >
            {rate}×
          </button>
          <button
            onClick={() => (document.fullscreenElement ? document.exitFullscreen() : box.current?.requestFullscreen?.())}
            aria-label="Full screen"
            className="grid size-9 place-items-center rounded-full hover:bg-white/10"
          >
            <Expand size={18} />
          </button>
        </div>
      </motion.div>

      <AnimatePresence>{overlay}</AnimatePresence>
    </div>
  );
}
