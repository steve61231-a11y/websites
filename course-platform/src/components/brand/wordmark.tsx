"use client";

import { motion, useReducedMotion } from "motion/react";
import { useId } from "react";
import { WORDMARK_PROD, WORDMARK_THE, WORDMARK_VIEWBOX } from "./wordmark-paths";

/**
 * THE PROD wordmark. With `animate`, "PROD" rises out of a mask and "THE"
 * drops in after it, the way the logo would be revealed in a title sequence.
 */
export function Wordmark({ className, animate = false, delay = 0 }: { className?: string; animate?: boolean; delay?: number }) {
  const reduce = useReducedMotion();
  const clip = `wm-${useId().replace(/:/g, "")}`;
  const on = animate && !reduce;
  const [x, y, w, h] = WORDMARK_VIEWBOX.split(" ").map(Number);
  return (
    <svg viewBox={WORDMARK_VIEWBOX} className={className} style={{ aspectRatio: `${w} / ${h}` }} role="img" aria-label="THE PROD">
      <defs>
        <clipPath id={clip}>
          <rect x={x} y={y - h} width={w} height={h * 2} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clip})`} fill="currentColor">
        <motion.path
          d={WORDMARK_PROD}
          initial={on ? { y: h * 1.1 } : false}
          animate={{ y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay }}
        />
        <motion.path
          d={WORDMARK_THE}
          initial={on ? { y: -40, opacity: 0 } : false}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: delay + 0.3 }}
        />
      </g>
    </svg>
  );
}
