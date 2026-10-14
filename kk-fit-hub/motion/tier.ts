import type { Tier } from "./types";

type NavigatorExtras = Navigator & {
  deviceMemory?: number;
  connection?: { saveData?: boolean; effectiveType?: string };
};

function hasWebGL2(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    const ok = Boolean(gl);
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return ok;
  } catch {
    return false;
  }
}

/**
 * Device tier, decided once on the client (PRD 11.3).
 *  A: fine pointer, 8+ cores, WebGL 2.
 *  B: touch (or smaller desktops) with WebGL 2 and 4 GB+ memory where reported.
 *  C: saveData, 2G/3G, 2 GB or less, no WebGL, or reduced motion. Defaults only.
 */
export function detectTier(): Tier {
  if (typeof window === "undefined") return "C";
  const forced = new URLSearchParams(window.location.search).get("tier");
  if (forced === "A" || forced === "B" || forced === "C") return forced;
  const nav = navigator as NavigatorExtras;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "C";
  if (nav.connection?.saveData) return "C";
  if (nav.connection?.effectiveType && /(^|-)(2g|3g)$/.test(nav.connection.effectiveType)) return "C";
  if (nav.deviceMemory !== undefined && nav.deviceMemory <= 2) return "C";
  if (!hasWebGL2()) return "C";
  const fine = window.matchMedia("(pointer: fine)").matches;
  if (fine && (nav.hardwareConcurrency ?? 0) >= 8) return "A";
  if (nav.deviceMemory !== undefined && nav.deviceMemory < 4) return "C";
  return "B";
}

/** A tier lowered by the frame-rate guard sticks for the session. */
const KEY = "kk-tier-cap";
export function cappedTier(t: Tier): Tier {
  try {
    const cap = sessionStorage.getItem(KEY) as Tier | null;
    if (cap && cap > t) return cap; // "B" > "A" alphabetically: lower tier wins
  } catch {
    // ignore
  }
  return t;
}
export function capTier(t: Tier) {
  try {
    sessionStorage.setItem(KEY, t);
  } catch {
    // ignore
  }
}
