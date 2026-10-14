"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Success screen: a check draws in 600ms (PRD 11.6). With `knot`, a small
 * belt-knot glyph tightens beside it (request success). Focus moves to the
 * title so screen readers announce the result.
 */
export function SuccessScreen({ title, children, knot = false }: { title: string; children: ReactNode; knot?: boolean }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.scrollIntoView({ block: "center" });
  }, []);
  return (
    <div className="animate-[kk-fade_var(--dur-medium)_var(--ease-out)_both]" data-success>
      <div className="flex items-center gap-4" aria-hidden="true">
        <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
          <circle cx="28" cy="28" r="27" fill="var(--green-100)" />
          <path
            d="M17 29l7 7 15-16"
            stroke="var(--green-700)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={100}
            strokeDasharray="100"
            style={{ ["--draw-length" as string]: 100, animation: "kk-draw 600ms var(--ease-out) 150ms both" }}
          />
        </svg>
        {knot && (
          <svg width="56" height="28" viewBox="0 0 56 28" fill="none" className="text-ink-900">
            <rect x="2" y="11" width="52" height="6" rx="3" fill="currentColor" />
            <g style={{ transformOrigin: "28px 14px", animation: "kk-knot 700ms var(--ease-out) 300ms both" }}>
              <rect x="21" y="6" width="14" height="16" rx="4" fill="currentColor" />
              <path d="M24 22l-5 6M32 22l5 6" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
            </g>
            <path d="M44 11v6M47 11v6M50 11v6" stroke="var(--orange-500)" strokeWidth="1.5" />
          </svg>
        )}
      </div>
      <h2 ref={ref} tabIndex={-1} className="type-display-l mt-6 outline-none">
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </div>
  );
}
