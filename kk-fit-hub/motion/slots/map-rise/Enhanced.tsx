"use client";

import type { EnhancedProps } from "../../types";
import { takeOverReveals, useGsap } from "../../useGsap";

/** map-rise, enhanced: served counties fill one by one, Nairobi first, with a
 * slight lift. */
export default function MapEnhanced({ containerRef }: EnhancedProps) {
  useGsap(containerRef, ({ gsap }, el) => {
    takeOverReveals(el);
    const counties = [...el.querySelectorAll<SVGPathElement>("[data-served]")].sort(
      (a, b) => Number(getComputedStyle(a).getPropertyValue("--i") || 0) - Number(getComputedStyle(b).getPropertyValue("--i") || 0),
    );
    gsap.from(counties, {
      opacity: 0,
      y: 8,
      fill: "#a9d8b5",
      duration: 0.7,
      ease: "expo.out",
      stagger: 0.14,
      scrollTrigger: { trigger: el, start: "top 75%", once: true },
    });
  });
  return null;
}
