"use client";

import type { EnhancedProps } from "../../types";
import { useGsap } from "../../useGsap";

/** founder-counters, enhanced: counters count up (default), plus the portrait
 * drifts slightly slower than the page (0.9× scroll speed). */
export default function FounderEnhanced({ containerRef }: EnhancedProps) {
  useGsap(containerRef, ({ gsap }, el) => {
    const portrait = el.querySelector<HTMLElement>("[data-photo-placeholder], img");
    if (!portrait) return;
    gsap.fromTo(
      portrait,
      { yPercent: -5 },
      { yPercent: 5, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } },
    );
  });
  return null;
}
