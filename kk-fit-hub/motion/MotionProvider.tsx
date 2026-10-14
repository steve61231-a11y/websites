"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { track } from "@/lib/analytics";
import { afterLoadIdle } from "./idle";
import { capTier, cappedTier, detectTier } from "./tier";
import type { Tier } from "./types";

const PointerEffects = dynamic(() => import("./PointerEffects"), { ssr: false });

type MotionState = {
  tier: Tier | null;
  reducedMotion: boolean;
  /** Called by the frame-rate guard: drops one tier for the session. */
  downgrade: () => void;
};
const MotionContext = createContext<MotionState>({ tier: null, reducedMotion: false, downgrade: () => {} });
export const useMotion = () => useContext(MotionContext);

/**
 * Decides the tier once, marks <html data-tier>, and for tiers A and B loads
 * GSAP (ScrollTrigger) and Lenis smooth scrolling synced to GSAP's ticker
 * (PRD 11.6). Tier C never downloads them.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  const [tier, setTier] = useState<Tier | null>(null);
  const [reducedMotion, setReduced] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const t = cappedTier(detectTier());
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.documentElement.dataset.tier = t;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reading device capabilities after mount
    setTier(t);
    setReduced(reduce);
    try {
      if (!sessionStorage.getItem("kk-tier-tracked")) {
        sessionStorage.setItem("kk-tier-tracked", "1");
        track("motion_tier", { tier: t });
      }
    } catch {
      track("motion_tier", { tier: t });
    }
  }, []);

  // Smooth scrolling and ScrollTrigger for tiers A and B.
  useEffect(() => {
    if (!tier || tier === "C" || reducedMotion) return;
    let cancelled = false;
    let cleanup = () => {};
    (async () => {
      await afterLoadIdle();
      if (cancelled) return;
      const [{ gsap }, { ScrollTrigger }, { default: Lenis }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
        import("lenis"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      const lenis = new Lenis({ duration: 1.1, easing: (t: number) => 1 - Math.pow(1 - t, 4), anchors: true });
      lenis.on("scroll", ScrollTrigger.update);
      const raf = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);
      document.documentElement.dataset.lenis = "";
      // Pause smooth scrolling while the mobile menu (a modal) is open.
      const observer = new MutationObserver(() => {
        if (document.documentElement.dataset.menuOpen !== undefined) lenis.stop();
        else lenis.start();
      });
      observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-menu-open"] });
      (window as unknown as { __lenis?: unknown }).__lenis = lenis;
      cleanup = () => {
        observer.disconnect();
        gsap.ticker.remove(raf);
        lenis.destroy();
        delete document.documentElement.dataset.lenis;
      };
    })();
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [tier, reducedMotion]);

  // Recalculate scroll positions after navigation.
  useEffect(() => {
    if (!tier || tier === "C") return;
    void import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => requestAnimationFrame(() => ScrollTrigger.refresh()));
  }, [pathname, tier]);

  const downgrade = () => {
    setTier((t) => {
      const next: Tier = t === "A" ? "B" : "C";
      capTier(next);
      document.documentElement.dataset.tier = next;
      return next;
    });
  };

  return (
    <MotionContext value={{ tier, reducedMotion, downgrade }}>
      {children}
      {tier === "A" && !reducedMotion && <PointerEffects />}
    </MotionContext>
  );
}
