"use client";

import { animate as tween, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useEffect, useId } from "react";

// The course's "product shot": a rendered lens whose iris opens on load.
// Pure SVG so it is crisp at any size and needs no image hosting.

type Props = {
  className?: string;
  /** 0 = closed, 1 = wide open */
  aperture?: number;
  animate?: boolean;
  hue?: number;
};

const BLADES = 9;
const C = 200;
const R = 120;

function vertices(r: number) {
  const twist = (1 - r / R) * 0.9;
  return Array.from({ length: BLADES }, (_, i) => {
    const a = (i / BLADES) * Math.PI * 2 + twist;
    return [C + Math.cos(a) * r, C + Math.sin(a) * r] as const;
  });
}

function irisPath(r: number) {
  const v = vertices(r);
  const outer = `M ${C + R + 2} ${C} A ${R + 2} ${R + 2} 0 1 0 ${C - R - 2} ${C} A ${R + 2} ${R + 2} 0 1 0 ${C + R + 2} ${C} Z`;
  return `${outer} M ${v.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(" L ")} Z`;
}

function bladeEdges(r: number) {
  const v = vertices(r);
  return v
    .map(([x, y], i) => {
      const [nx, ny] = v[(i + 1) % BLADES];
      const dx = nx - x;
      const dy = ny - y;
      const len = Math.hypot(dx, dy) || 1;
      const ex = x - (dx / len) * R * 2;
      const ey = y - (dy / len) * R * 2;
      return `M ${x.toFixed(2)} ${y.toFixed(2)} L ${ex.toFixed(2)} ${ey.toFixed(2)}`;
    })
    .join(" ");
}

export function LensArt({ className, aperture = 0.78, animate = true, hue = 215 }: Props) {
  const id = useId().replace(/:/g, "");
  const reduce = useReducedMotion();
  const open = 30 + aperture * 80; // radius of the iris opening
  const radius = useMotionValue(animate && !reduce ? 8 : open);
  const iris = useTransform(radius, irisPath);
  const edges = useTransform(radius, bladeEdges);

  useEffect(() => {
    const controls = tween(radius, open, { duration: 2.4, ease: [0.22, 1, 0.36, 1], delay: 0.25 });
    return () => controls.stop();
  }, [radius, open]);

  return (
    <svg viewBox="0 0 400 400" className={className} role="img" aria-label="Camera lens">
      <defs>
        <radialGradient id={`barrel-${id}`} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#3a3a3c" />
          <stop offset="70%" stopColor="#1c1c1e" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </radialGradient>
        <linearGradient id={`ring-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#8e8e93" />
          <stop offset="45%" stopColor="#2c2c2e" />
          <stop offset="100%" stopColor="#636366" />
        </linearGradient>
        <radialGradient id={`glass-${id}`} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor={`hsl(${hue + 40} 90% 70%)`} stopOpacity="0.9" />
          <stop offset="35%" stopColor={`hsl(${hue} 80% 35%)`} stopOpacity="0.85" />
          <stop offset="75%" stopColor={`hsl(${hue - 20} 70% 10%)`} />
          <stop offset="100%" stopColor="#000" />
        </radialGradient>
        <radialGradient id={`flare-${id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <clipPath id={`iris-${id}`}>
          <circle cx="200" cy="200" r="118" />
        </clipPath>
      </defs>

      {/* Barrel */}
      <circle cx="200" cy="200" r="196" fill={`url(#barrel-${id})`} />
      <circle cx="200" cy="200" r="182" fill="none" stroke={`url(#ring-${id})`} strokeWidth="3" />
      {/* Knurled focus ring */}
      <g opacity="0.55">
        {Array.from({ length: 120 }).map((_, i) => {
          const a = (i / 120) * Math.PI * 2;
          return (
            <line
              key={i}
              x1={200 + Math.cos(a) * 166}
              y1={200 + Math.sin(a) * 166}
              x2={200 + Math.cos(a) * 176}
              y2={200 + Math.sin(a) * 176}
              stroke="#48484a"
              strokeWidth="1.2"
            />
          );
        })}
      </g>
      <circle cx="200" cy="200" r="150" fill="#0b0b0c" stroke="#2c2c2e" strokeWidth="2" />
      <circle cx="200" cy="200" r="132" fill="none" stroke={`url(#ring-${id})`} strokeWidth="1.5" opacity="0.7" />

      {/* Glass */}
      <circle cx="200" cy="200" r="120" fill={`url(#glass-${id})`} />

      {/* Iris */}
      <g clipPath={`url(#iris-${id})`}>
        <motion.path d={iris} fill="#050505" fillRule="evenodd" />
        <motion.path d={edges} stroke="#2a2a2c" strokeWidth="1.2" fill="none" />
      </g>

      {/* Reflections */}
      <ellipse cx="158" cy="148" rx="46" ry="22" fill={`url(#flare-${id})`} opacity="0.35" transform="rotate(-35 158 148)" />
      <circle cx="252" cy="250" r="9" fill="#fff" opacity="0.18" />
      <circle cx="140" cy="132" r="5" fill="#fff" opacity="0.7" />

      {/* Engraving */}
      <path id={`arc-${id}`} d="M 60 200 A 140 140 0 0 1 340 200" fill="none" />
      <text fill="#8e8e93" fontSize="10.5" letterSpacing="3" fontFamily="var(--font-sans)">
        <textPath href={`#arc-${id}`} startOffset="50%" textAnchor="middle">
          LUMEN  50mm  1:1.8  ⌀58
        </textPath>
      </text>
    </svg>
  );
}
