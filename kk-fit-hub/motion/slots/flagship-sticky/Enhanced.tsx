"use client";

import type { EnhancedProps } from "../../types";
import { takeOverReveals, useGsap } from "../../useGsap";

/** flagship-sticky, enhanced (desktop): the active benefit is full ink, the
 * others 30%; the pinned photo shifts grade per benefit; counter 01 / 05. */
const grades = [
  "none",
  "saturate(0.9) contrast(1.05)",
  "saturate(1.05) brightness(1.04)",
  "saturate(0.85) contrast(1.08)",
  "saturate(1) brightness(0.97)",
];

export default function FlagshipEnhanced({ containerRef }: EnhancedProps) {
  useGsap(containerRef, ({ gsap, ScrollTrigger }, el) => {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px)", () => {
      takeOverReveals(el);
      const items = [...el.querySelectorAll<HTMLElement>("[data-benefit]")];
      const counter = el.querySelector<HTMLElement>("[data-flagship-counter]");
      const index = el.querySelector<HTMLElement>("[data-flagship-index]");
      const photo = el.querySelector<HTMLElement>("[data-photo-placeholder], img");
      if (counter) counter.hidden = false;
      gsap.set(items, { opacity: 0.3 });
      const activate = (i: number) => {
        gsap.to(items, { opacity: (j: number) => (j === i ? 1 : 0.3), duration: 0.45, ease: "power2.out", overwrite: true });
        if (index) index.textContent = String(i + 1).padStart(2, "0");
        if (photo) gsap.to(photo, { filter: grades[i % grades.length], duration: 0.8, overwrite: true });
      };
      items.forEach((item, i) =>
        ScrollTrigger.create({
          trigger: item,
          start: "top 55%",
          end: "bottom 55%",
          onToggle: (st) => st.isActive && activate(i),
        }),
      );
      activate(0);
      return () => {
        if (counter) counter.hidden = true;
      };
    });
    return () => mm.revert();
  });
  return null;
}
