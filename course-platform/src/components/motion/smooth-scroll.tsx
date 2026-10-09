"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// Inertial scrolling, like a native app. Skipped for reduced motion and on
// touch devices, which already scroll natively. Elements that scroll on their
// own (sheets, lesson lists) opt out with data-lenis-prevent.
export function SmoothScroll() {
  const lenis = useRef<Lenis | null>(null);
  const path = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;
    // lerp follows the wheel closely (responsive) while still gliding to a stop.
    const instance = new Lenis({ lerp: 0.12, wheelMultiplier: 1, anchors: { offset: -72 } });
    lenis.current = instance;
    let frame = 0;
    const raf = (time: number) => {
      instance.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);
    return () => {
      cancelAnimationFrame(frame);
      instance.destroy();
      lenis.current = null;
    };
  }, []);

  // After a route change the router sets the scroll position (top for new
  // pages, restored for back). Snap Lenis to it so leftover momentum from the
  // previous page never drags the new one.
  useEffect(() => {
    const l = lenis.current;
    if (!l) return;
    const id = requestAnimationFrame(() => l.scrollTo(window.scrollY, { immediate: true, force: true }));
    return () => cancelAnimationFrame(id);
  }, [path]);

  return null;
}
