"use client";

import { motion } from "motion/react";
import { useEffect, useRef } from "react";

// Restrained confetti: slim paper strips in a muted palette that drift and
// tumble, then fade. A moment of delight, not a slot machine.

const PALETTES = {
  calm: ["#0071e3", "#28a745", "#1d1d1f", "#d2d2d7", "#5e5ce6"],
  gold: ["#b08d57", "#d9bf8c", "#f5f5f7", "#8e6b3a", "#ffffff"],
};

export function Confetti({ palette = "calm", count = 90 }: { palette?: keyof typeof PALETTES; count?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
    };
    resize();
    const colors = PALETTES[palette];
    const w = canvas.clientWidth;
    const pieces = Array.from({ length: count }, () => ({
      x: w / 2 + (Math.random() - 0.5) * w * 0.5,
      y: canvas.clientHeight * 0.35,
      vx: (Math.random() - 0.5) * 9,
      vy: -6 - Math.random() * 9,
      w: 4 + Math.random() * 4,
      h: 9 + Math.random() * 8,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.25,
      tilt: Math.random() * Math.PI,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    const startedAt = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = (now - startedAt) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, t - 2.2) / 1.2);
      for (const p of pieces) {
        p.vy += 0.22;
        p.vx *= 0.985;
        p.vy *= 0.985;
        p.x += p.vx + Math.sin(t * 3 + p.tilt) * 0.6;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(1, Math.cos(t * 6 + p.tilt));
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (t < 3.5) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [palette, count]);

  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-[70] h-full w-full" aria-hidden />;
}

/** A check mark that draws itself inside a circle. */
export function CheckDraw({ size = 64, color = "var(--success)", delay = 0 }: { size?: number; color?: string; delay?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <motion.circle
        cx="32"
        cy="32"
        r="29"
        fill={color}
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay }}
        style={{ transformOrigin: "32px 32px" }}
      />
      <motion.path
        d="M19 33.5 L28 42 L45 23"
        fill="none"
        stroke="#fff"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.45, ease: "easeOut", delay: delay + 0.2 }}
      />
    </svg>
  );
}
