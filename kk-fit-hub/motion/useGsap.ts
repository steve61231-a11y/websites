"use client";

import { useEffect, type RefObject } from "react";

export type GsapKit = {
  gsap: typeof import("gsap").gsap;
  ScrollTrigger: typeof import("gsap/ScrollTrigger").ScrollTrigger;
};

let kit: Promise<GsapKit> | null = null;
/** GSAP and ScrollTrigger, loaded once and only for enhanced tiers. */
export function loadGsap(): Promise<GsapKit> {
  kit ??= Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([{ gsap }, { ScrollTrigger }]) => {
    gsap.registerPlugin(ScrollTrigger);
    return { gsap, ScrollTrigger };
  });
  return kit;
}

let refreshTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleRefresh(k: GsapKit) {
  if (refreshTimer) clearTimeout(refreshTimer);
  refreshTimer = setTimeout(() => k.ScrollTrigger.refresh(), 400);
}

/**
 * Runs a GSAP setup scoped to the slot container and reverts everything it
 * created on unmount (PRD 11.4: Enhanced must clean up after itself).
 */
export function useGsap(
  containerRef: RefObject<HTMLElement | null>,
  setup: (k: GsapKit, el: HTMLElement) => void | (() => void),
  deps: unknown[] = [],
) {
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let ctx: { revert: () => void } | null = null;
    let extra: void | (() => void);
    let cancelled = false;
    void loadGsap().then((k) => {
      if (cancelled) return;
      ctx = k.gsap.context(() => {
        extra = setup(k, el);
      }, el);
      // New triggers measure themselves; one debounced refresh settles pins.
      scheduleRefresh(k);
    });
    return () => {
      cancelled = true;
      if (typeof extra === "function") extra();
      ctx?.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setup is defined inline per slot
  }, [containerRef, ...deps]);
}

/** Marks default reveals inside the slot as shown, so enhanced motion owns them. */
export function takeOverReveals(el: HTMLElement) {
  el.querySelectorAll("[data-reveal]").forEach((n) => n.setAttribute("data-revealed", ""));
}
