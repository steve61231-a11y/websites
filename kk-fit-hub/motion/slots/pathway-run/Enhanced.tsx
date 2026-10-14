"use client";

import type { EnhancedProps } from "../../types";
import { takeOverReveals, useGsap } from "../../useGsap";

/** pathway-run, enhanced: a glowing point travels the energy line with scroll
 * and lights each milestone. */
export default function PathwayEnhanced({ containerRef }: EnhancedProps) {
  useGsap(containerRef, ({ gsap }, el) => {
    takeOverReveals(el);
    const dot = el.querySelector<HTMLElement>("[data-pathway-dot]");
    const line = el.querySelector<HTMLElement>("[data-pathway-line]");
    const milestones = [...el.querySelectorAll<HTMLElement>("[data-milestone-dot]")];
    if (!dot || !line) return;
    dot.hidden = false;
    dot.style.cssText =
      "display:block;position:absolute;width:14px;height:14px;border-radius:999px;background:#fff;box-shadow:0 0 0 4px rgb(228 87 46/.35),0 0 24px 6px rgb(58 166 85/.6);z-index:2;pointer-events:none";
    const light = (progress: number) =>
      milestones.forEach((m, i) => {
        const on = progress >= i / Math.max(1, milestones.length - 1) - 0.02;
        m.style.transition = "background-color 240ms, transform 240ms";
        m.style.backgroundColor = on ? "var(--green-500)" : "";
        m.style.transform = on ? "scale(1.25)" : "";
      });
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px)", () => {
      gsap.set(dot, { top: 1, left: -7, x: 0 });
      gsap.to(dot, {
        x: () => line.offsetWidth * 0.78,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top 75%", end: "bottom 45%", scrub: true, invalidateOnRefresh: true, onUpdate: (st) => light(st.progress) },
      });
    });
    mm.add("(max-width: 1023.98px)", () => {
      gsap.set(dot, { left: 1, top: 2, y: 0 });
      gsap.to(dot, {
        y: () => line.offsetHeight * 0.9,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top 70%", end: "bottom 50%", scrub: true, invalidateOnRefresh: true, onUpdate: (st) => light(st.progress) },
      });
    });
    return () => {
      mm.revert();
      dot.hidden = true;
      dot.removeAttribute("style");
      light(-1);
    };
  });
  return null;
}
