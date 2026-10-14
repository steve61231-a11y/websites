"use client";

import type { EnhancedProps } from "../../types";
import { useGsap } from "../../useGsap";

/**
 * hero-strike, enhanced (PRD 6.1, 11.5): the photo and the KENPO word move in
 * depth with the pointer (tier A) or device tilt (tier B); on scroll the
 * camera pushes toward the fist, then a circle opens from the strike point
 * onto the light manifesto ("impact reveal"). It finishes within one
 * viewport of scroll, and scrolling back reverses it.
 */
export default function HeroStrikeEnhanced({ containerRef, tier, strikePoint }: EnhancedProps) {
  useGsap(containerRef, ({ gsap }, el) => {
    const photo = el.querySelector<HTMLElement>("[data-hero-photo]");
    const word = el.querySelector<HTMLElement>("[data-hero-word]");
    const section = el.closest("section");
    if (!photo || !word || !section) return;
    const cleanups: (() => void)[] = [];

    // Depth: two layers move by different amounts.
    const px = gsap.quickTo(photo, "x", { duration: 0.8, ease: "power3.out" });
    const py = gsap.quickTo(photo, "y", { duration: 0.8, ease: "power3.out" });
    const wx = gsap.quickTo(word, "x", { duration: 1.2, ease: "power3.out" });
    const wy = gsap.quickTo(word, "y", { duration: 1.2, ease: "power3.out" });
    const move = (nx: number, ny: number) => {
      px(nx * 18);
      py(ny * 12);
      wx(nx * -6);
      wy(ny * -4);
    };
    if (tier === "A") {
      const onMove = (e: PointerEvent) => move(e.clientX / innerWidth - 0.5, e.clientY / innerHeight - 0.5);
      window.addEventListener("pointermove", onMove, { passive: true });
      cleanups.push(() => window.removeEventListener("pointermove", onMove));
    } else {
      // Device tilt where the browser allows it without a prompt (Android).
      const onTilt = (e: DeviceOrientationEvent) => {
        if (e.gamma === null || e.beta === null) return;
        move(Math.max(-1, Math.min(1, e.gamma / 30)) / 2, Math.max(-1, Math.min(1, (e.beta - 45) / 30)) / 2);
      };
      window.addEventListener("deviceorientation", onTilt, { passive: true });
      cleanups.push(() => window.removeEventListener("deviceorientation", onTilt));
    }

    const mm = gsap.matchMedia();
    // Pinning adds scroll space. Only do it while the visitor is still at the
    // top, so content they can already see never jumps (no layout shift).
    const canPin = window.scrollY < 8;
    mm.add(canPin ? "(min-width: 1024px)" : "(min-width: 99999px)", () => {
      const sp = strikePoint?.desktop ?? { x: 20, y: 40 };
      // Overlay that opens from the fist onto the manifesto's white.
      const overlay = document.createElement("div");
      overlay.setAttribute("aria-hidden", "true");
      overlay.style.cssText = "position:absolute;inset:0;background:#fff;pointer-events:none;z-index:5;clip-path:circle(0% at 50% 50%)";
      section.appendChild(overlay);
      const origin = () => {
        const s = section.getBoundingClientRect();
        const p = photo.getBoundingClientRect();
        return { x: p.left - s.left + (p.width * sp.x) / 100, y: p.top - s.top + (p.height * sp.y) / 100 };
      };
      const o = origin();
      gsap.set(photo, { transformOrigin: `${sp.x}% ${sp.y}%` });
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=100%",
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
          onUpdate: (st) => {
            if (st.progress > 0.75) overlay.setAttribute("data-theme", "light");
            else overlay.removeAttribute("data-theme");
          },
        },
      });
      tl.to(photo, { scale: 1.35, ease: "power2.in", duration: 0.55 }, 0)
        .to(el.querySelectorAll(".rise-in, .rise-in-solid"), { opacity: 0, y: -30, stagger: 0.02, duration: 0.3 }, 0.15)
        .fromTo(
          overlay,
          { clipPath: `circle(0% at ${o.x}px ${o.y}px)` },
          { clipPath: () => { const p = origin(); return `circle(150% at ${p.x}px ${p.y}px)`; }, ease: "power2.in", duration: 0.45 },
          0.55,
        );
      return () => overlay.remove();
    });
    mm.add(canPin ? "(max-width: 1023.98px)" : "all", () => {
      gsap.to(photo, {
        scale: 1.12,
        yPercent: -6,
        ease: "none",
        scrollTrigger: { trigger: section, start: "top top", end: "bottom top", scrub: true },
      });
    });
    cleanups.push(() => mm.revert());
    return () => cleanups.forEach((c) => c());
  });
  return null;
}
