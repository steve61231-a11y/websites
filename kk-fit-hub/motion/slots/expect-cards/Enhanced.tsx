"use client";

import type { EnhancedProps } from "../../types";
import { useGsap } from "../../useGsap";

/** expect-cards, enhanced (tier A): cards tilt up to 6° toward the pointer
 * with a soft light sheen. Touch keeps the CSS press. */
export default function ExpectCardsEnhanced({ containerRef }: EnhancedProps) {
  useGsap(containerRef, ({ gsap }, el) => {
    const cards = [...el.querySelectorAll<HTMLElement>("[data-expect-card]")];
    const off: (() => void)[] = [];
    cards.forEach((card) => {
      card.style.transformStyle = "preserve-3d";
      card.style.position = "relative";
      const sheen = document.createElement("span");
      sheen.setAttribute("aria-hidden", "true");
      sheen.style.cssText =
        "position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;transition:opacity 240ms;background:radial-gradient(240px circle at var(--mx,50%) var(--my,50%),rgb(255 255 255/.55),transparent 70%)";
      card.appendChild(sheen);
      const rx = gsap.quickTo(card, "rotationX", { duration: 0.5, ease: "power3.out" });
      const ry = gsap.quickTo(card, "rotationY", { duration: 0.5, ease: "power3.out" });
      gsap.set(card, { transformPerspective: 900 });
      const move = (e: PointerEvent) => {
        const r = card.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        ry(nx * 12);
        rx(-ny * 12);
        sheen.style.setProperty("--mx", `${(nx + 0.5) * 100}%`);
        sheen.style.setProperty("--my", `${(ny + 0.5) * 100}%`);
        sheen.style.opacity = "1";
      };
      const leave = () => {
        rx(0);
        ry(0);
        sheen.style.opacity = "0";
      };
      card.addEventListener("pointermove", move);
      card.addEventListener("pointerleave", leave);
      off.push(() => {
        card.removeEventListener("pointermove", move);
        card.removeEventListener("pointerleave", leave);
        sheen.remove();
      });
    });
    return () => off.forEach((f) => f());
  });
  return null;
}
