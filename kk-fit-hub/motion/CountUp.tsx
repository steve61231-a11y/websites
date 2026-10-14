"use client";

import { useEffect, useRef, useState } from "react";

/** Counts up once when in view (1.2 s). The final number is server-rendered;
 * with reduced motion it stays final (PRD 11.5 founder-counters). */
export function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) return; // already visible: keep final
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / 1200);
          const eased = 1 - Math.pow(1 - t, 4);
          setShown(Math.round(eased * value));
          if (t < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    const frame = requestAnimationFrame(() => setShown(0));
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
      cancelAnimationFrame(frame);
    };
  }, [value]);

  return (
    <span ref={ref} className="tabular">
      <span aria-hidden="true" className="inline-block text-right" style={{ minWidth: `${String(value).length}ch` }}>
        {shown}
      </span>
      <span aria-hidden="true">{suffix}</span>
      <span className="sr-only">
        {value}
        {suffix}
      </span>
    </span>
  );
}
