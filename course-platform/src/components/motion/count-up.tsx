"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";

/** A number that counts to its value when it comes into view, and on change. */
export function CountUp({ value, duration = 0.9, className }: { value: number; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const from = useRef(0);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView) return;
    if (reduce) {
      el.textContent = String(value);
      return;
    }
    const controls = animate(from.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => (el.textContent = String(Math.round(v))),
    });
    from.current = value;
    return () => controls.stop();
  }, [value, inView, duration, reduce]);

  return (
    <span ref={ref} className={className}>
      {reduce ? value : 0}
    </span>
  );
}
