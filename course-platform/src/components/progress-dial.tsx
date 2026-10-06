"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

// A ring split into one arc per module, like the mode dial on a camera.
// Each arc fills as that module's lessons and quiz are completed.

type Props = {
  segments: number[]; // 0–1 per module
  size?: number;
  stroke?: number;
  tone?: "light" | "dark";
  highlight?: number; // index of the current module
  from?: number[]; // previous values, to animate only what changed
  children?: ReactNode;
};

export function ProgressDial({ segments, size = 220, stroke = 10, tone = "light", highlight, from, children }: Props) {
  const r = (size - stroke) / 2;
  const c = size / 2;
  const gap = segments.length > 1 ? 7 : 0; // degrees
  const span = 360 / segments.length;
  const track = tone === "dark" ? "rgba(255,255,255,0.14)" : "#e8e8ed";

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        {segments.map((value, i) => {
          const start = i * span + gap / 2;
          const d = arc(c, c, r, start, start + span - gap);
          const done = value >= 1;
          const color = done ? "var(--success)" : "var(--accent)";
          return (
            <g key={i}>
              <path d={d} fill="none" stroke={track} strokeWidth={stroke} strokeLinecap="round" />
              <motion.path
                d={d}
                fill="none"
                stroke={color}
                strokeWidth={stroke}
                strokeLinecap="round"
                initial={{ pathLength: from?.[i] ?? 0, opacity: (from?.[i] ?? 0) > 0 ? 1 : 0 }}
                animate={{ pathLength: value, opacity: value > 0 ? 1 : 0 }}
                transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: from ? 0.5 : 0.15 + i * 0.06 }}
              />
              {highlight === i && value < 1 && (
                <motion.path
                  d={d}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth={stroke + 8}
                  strokeLinecap="round"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 0.18, 0] }}
                  transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                />
              )}
            </g>
          );
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

function arc(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const s = polar(cx, cy, r, startDeg);
  const e = polar(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}
