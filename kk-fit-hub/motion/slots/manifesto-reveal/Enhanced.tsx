"use client";

import type { EnhancedProps } from "../../types";
import { takeOverReveals, useGsap } from "../../useGsap";

/** manifesto-reveal, enhanced: each word brightens from 20% to 100% as it
 * crosses the middle of the screen (SplitText). */
export default function ManifestoEnhanced({ containerRef }: EnhancedProps) {
  useGsap(containerRef, ({ gsap }, el) => {
    const statement = el.querySelector<HTMLElement>("[data-manifesto-statement]");
    if (!statement) return;
    takeOverReveals(el);
    let split: { revert: () => void; words: Element[] } | null = null;
    let cancelled = false;
    void import("gsap/SplitText").then(({ SplitText }) => {
      if (cancelled) return;
      gsap.registerPlugin(SplitText);
      // aria "none": the words stay plain text for screen readers (no aria-label on a <p>).
      split = SplitText.create(statement, { type: "words", aria: "none" });
      gsap.fromTo(
        split.words,
        { opacity: 0.2 },
        {
          opacity: 1,
          stagger: 0.1,
          ease: "none",
          scrollTrigger: { trigger: statement, start: "top 70%", end: "bottom 45%", scrub: true },
        },
      );
    });
    return () => {
      cancelled = true;
      split?.revert();
    };
  });
  return null;
}
