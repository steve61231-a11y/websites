"use client";

import type { EnhancedProps } from "../../types";
import { takeOverReveals, useGsap } from "../../useGsap";

/** whynow-points, enhanced: points fade up and their icons draw their strokes. */
export default function WhyNowEnhanced({ containerRef }: EnhancedProps) {
  useGsap(containerRef, ({ gsap }, el) => {
    takeOverReveals(el);
    const items = [...el.querySelectorAll<HTMLElement>("li")];
    items.forEach((li, i) => {
      const strokes = [...li.querySelectorAll<SVGGeometryElement>("svg path, svg circle, svg line, svg rect, svg polyline")];
      strokes.forEach((s) => {
        const len = s.getTotalLength?.() ?? 60;
        gsap.set(s, { strokeDasharray: len, strokeDashoffset: len });
      });
      const tl = gsap.timeline({ scrollTrigger: { trigger: li, start: "top 85%", once: true } });
      tl.from(li, { opacity: 0, y: 24, duration: 0.8, ease: "expo.out", delay: i * 0.07 }).to(
        strokes,
        { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut", stagger: 0.08 },
        "-=0.5",
      );
    });
  });
  return null;
}
