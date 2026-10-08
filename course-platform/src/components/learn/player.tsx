"use client";

import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { formatClock } from "@/lib/catalog";
import type { Lesson, Module } from "@/lib/types";
import { Back10, Expand, Pause, Play } from "@/components/icons";

// Stand-in player until the videos are uploaded. In Phase 4 the stage below
// becomes the video provider's player (Bunny Stream or Mux) fed a short-lived
// signed token from the server; controls, watermark and progress stay.

type Props = {
  episode: Module;
  lesson: Lesson;
  startAt: number;
  watermark: string;
  onProgress: (seconds: number) => void;
  onEnded: () => void;
  overlay?: ReactNode;
};

const RATES = [1, 1.5, 2, 8];

export function Player({ episode, lesson, startAt, watermark, onProgress, onEnded, overlay }: Props) {
  const duration = lesson.durationSec;
  const [time, setTime] = useState(startAt >= duration - 1 ? 0 : startAt);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [chrome, setChrome] = useState(true);
  const box = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const ended = useRef(false);
  const lastSaved = useRef(0);

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

  const showChrome = chrome || !playing;
  const pct = (time / duration) * 100;

  return (
    <div
      ref={box}
      onMouseMove={poke}
      onTouchStart={poke}
      className="group relative aspect-video w-full select-none overflow-hidden bg-black sm:rounded-[28px]"
    >
      {/* Stage */}
      <div className="absolute inset-0" onClick={toggle}>
        <motion.img
          src={episode.still}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          animate={playing ? { scale: 1.12, x: "-2%" } : { scale: 1, x: "0%" }}
          transition={{ duration: playing ? 40 : 1.2, ease: playing ? "linear" : [0.16, 1, 0.3, 1] }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
        <AnimatePresence>
          {!playing && time === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute left-0 top-0 p-5 sm:p-8"
            >
              <p className="eyebrow">{episode.label}</p>
              <p className="headline mt-2 max-w-[18ch] text-[clamp(20px,3vw,34px)] text-white">{lesson.title}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Watermark */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <p className="absolute left-[6%] top-[10%] animate-[drift_48s_ease-in-out_infinite] whitespace-nowrap text-[10px] font-medium text-white/25 sm:text-[12px]">
          {watermark}
        </p>
      </div>

      {/* Big play */}
      <AnimatePresence>
        {!playing && !overlay && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.25 }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
            onClick={toggle}
            aria-label="Play"
            className="absolute left-1/2 top-1/2 grid size-[72px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white ring-1 ring-inset ring-white/25 backdrop-blur-xl transition-colors hover:bg-white/25 sm:size-24"
          >
            <Play size={32} className="ml-1" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Controls */}
      <motion.div
        animate={{ opacity: showChrome && !overlay ? 1 : 0, y: showChrome && !overlay ? 0 : 8 }}
        transition={{ duration: 0.35 }}
        className="absolute inset-x-0 bottom-0 px-4 pb-3 pt-12 sm:px-7 sm:pb-6"
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
          <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-white/20 transition-[height] group-hover/bar:h-1.5">
            <div className="h-full rounded-full bg-amber" style={{ width: `${pct}%` }} />
          </div>
          <div className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 shadow transition-opacity group-hover/bar:opacity-100" style={{ left: `${pct}%` }} />
        </div>
        <div className="mt-1.5 flex items-center gap-1 text-white sm:gap-2">
          <button onClick={toggle} aria-label={playing ? "Pause" : "Play"} className="grid size-10 place-items-center rounded-full hover:bg-white/10">
            {playing ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button onClick={() => seek(time - 10)} aria-label="Back 10 seconds" className="grid size-10 place-items-center rounded-full hover:bg-white/10">
            <Back10 size={20} />
          </button>
          <span className="ml-1 text-[12px] tabular-nums text-white/80 sm:text-[13px]">
            {formatClock(time)} / {formatClock(duration)}
          </span>
          <span className="flex-1" />
          <button
            onClick={() => setRate(RATES[(RATES.indexOf(rate) + 1) % RATES.length])}
            className="min-w-12 rounded-full px-2.5 py-1.5 text-[12px] font-bold tabular-nums hover:bg-white/10"
            aria-label="Playback speed"
          >
            {rate}×
          </button>
          <button
            onClick={() => (document.fullscreenElement ? document.exitFullscreen() : box.current?.requestFullscreen?.()?.catch(() => {}))}
            aria-label="Full screen"
            className="grid size-10 place-items-center rounded-full hover:bg-white/10"
          >
            <Expand size={18} />
          </button>
        </div>
      </motion.div>

      <AnimatePresence>{overlay}</AnimatePresence>
    </div>
  );
}
