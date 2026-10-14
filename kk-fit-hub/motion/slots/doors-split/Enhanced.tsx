"use client";

import type { EnhancedProps } from "../../types";
import { useGsap } from "../../useGsap";

/** doors-split, enhanced (desktop, pointer): the hovered door widens to 60%.
 * Buttons are magnetic through the global pointer effects. No widening on touch. */
export default function DoorsEnhanced({ containerRef }: EnhancedProps) {
  useGsap(containerRef, ({ gsap }, el) => {
    const mm = gsap.matchMedia();
    mm.add("(min-width: 1024px) and (hover: hover)", () => {
      const doors = [...el.querySelectorAll<HTMLElement>("[data-door]")];
      const set = (active: HTMLElement | null) =>
        doors.forEach((d) =>
          gsap.to(d, { flexGrow: active === null ? 1 : d === active ? 1.5 : 1, duration: 0.6, ease: "expo.out", overwrite: true }),
        );
      const enter = (e: Event) => set(e.currentTarget as HTMLElement);
      const leave = () => set(null);
      doors.forEach((d) => d.addEventListener("pointerenter", enter));
      el.addEventListener("pointerleave", leave);
      return () => {
        doors.forEach((d) => d.removeEventListener("pointerenter", enter));
        el.removeEventListener("pointerleave", leave);
        gsap.set(doors, { clearProps: "flexGrow" });
      };
    });
    return () => mm.revert();
  });
  return null;
}
