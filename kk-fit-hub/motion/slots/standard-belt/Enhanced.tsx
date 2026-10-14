"use client";

import type { EnhancedProps } from "../../types";
import { takeOverReveals, useGsap } from "../../useGsap";

/** standard-belt, enhanced: segments fill along the belt with scroll, like a
 * belt being tied on; the last segment's stripes slide in. */
export default function BeltEnhanced({ containerRef }: EnhancedProps) {
  useGsap(containerRef, ({ gsap }, el) => {
    takeOverReveals(el);
    const segments = [...el.querySelectorAll<HTMLElement>("[data-belt-segment]")];
    const stripes = [...el.querySelectorAll<HTMLElement>("[data-belt-stripes] > span")];
    const mm = gsap.matchMedia();
    const run = (from: string) => {
      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 75%", end: "bottom 55%", scrub: 0.5 } });
      segments.forEach((s) => tl.fromTo(s, { clipPath: from }, { clipPath: "inset(0 0 0 0)", ease: "none", duration: 1 }));
      tl.from(stripes, { opacity: 0, x: (i) => 8 + i * 4, stagger: 0.15, duration: 0.5 });
    };
    mm.add("(min-width: 1024px)", () => run("inset(0 100% 0 0)"));
    mm.add("(max-width: 1023.98px)", () => run("inset(0 0 100% 0)"));
    return () => mm.revert();
  });
  return null;
}
