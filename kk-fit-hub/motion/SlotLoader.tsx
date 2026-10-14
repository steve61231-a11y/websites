"use client";

import { useEffect, useRef, useState } from "react";
import { useMotion } from "./MotionProvider";
import { enhanced, metas } from "./registry";
import type { SlotId } from "./types";
import { photos } from "@/content/media";
import { nextIdleTurn } from "./idle";


/**
 * Swaps in a slot's Enhanced version when the tier allows, the browser is
 * idle and the slot is within one viewport (PRD 11.4, 12). It attaches to
 * the Default's container, so nothing shifts.
 */
export function SlotLoader({ id }: { id: SlotId }) {
  const marker = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLElement | null>(null);
  const { tier, reducedMotion } = useMotion();
  const [ready, setReady] = useState(false);
  const meta = metas[id];
  const allowed = !reducedMotion && (tier === "A" || (tier === "B" && meta.minTier === "B"));

  useEffect(() => {
    if (!allowed || ready) return;
    const el = marker.current?.parentElement;
    if (!el) return;
    containerRef.current = el;
    let cancelled = false;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        void nextIdleTurn().then(() => !cancelled && setReady(true));
      },
      { rootMargin: meta.preloadMargin },
    );
    io.observe(el);
    return () => {
      cancelled = true;
      io.disconnect();
    };
  }, [allowed, ready, meta.preloadMargin]);

  const Enhanced = enhanced[id];
  return (
    <>
      <span ref={marker} hidden />
      {allowed && ready && (tier === "A" || tier === "B") && (
        <Enhanced
          containerRef={containerRef}
          tier={tier}
          reducedMotion={reducedMotion}
          strikePoint={id === "hero-strike" ? photos["kennedy-strike"].strikePoint : undefined}
        />
      )}
    </>
  );
}
