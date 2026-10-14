"use client";

import type { EnhancedProps } from "../../types";
import { takeOverReveals, useGsap } from "../../useGsap";

/** process-line, enhanced: the connecting line draws with scroll and each
 * step number lights as the line reaches it. */
export default function ProcessLineEnhanced({ containerRef }: EnhancedProps) {
  useGsap(containerRef, ({ gsap }, el) => {
    takeOverReveals(el);
    const line = el.querySelector<HTMLElement>("[data-process-line]");
    const numbers = [...el.querySelectorAll<HTMLElement>("[data-step-number]")];
    if (!line) return;
    const light = (n: HTMLElement, on: boolean) => {
      n.style.transition = "background-color 240ms, color 240ms";
      n.style.backgroundColor = on ? "var(--green-600)" : "";
      n.style.color = on ? "#fff" : "";
    };
    const mm = gsap.matchMedia();
    const run = (axis: "scaleX" | "scaleY") => {
      gsap.fromTo(
        line,
        { [axis]: 0 },
        {
          [axis]: 1,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top 70%",
            end: "bottom 60%",
            scrub: true,
            onUpdate: (st) => numbers.forEach((n, i) => light(n, st.progress >= i / Math.max(1, numbers.length - 1) - 0.02)),
          },
        },
      );
      return () => numbers.forEach((n) => light(n, false));
    };
    mm.add("(min-width: 1024px)", () => run("scaleX"));
    mm.add("(max-width: 1023.98px)", () => run("scaleY"));
    return () => mm.revert();
  });
  return null;
}
