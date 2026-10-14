"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { EnhancedProps, SlotId, SlotMeta } from "./types";
import { meta as doorsSplit } from "./slots/doors-split/meta";
import { meta as expectCards } from "./slots/expect-cards/meta";
import { meta as flagshipSticky } from "./slots/flagship-sticky/meta";
import { meta as founderCounters } from "./slots/founder-counters/meta";
import { meta as heroStrike } from "./slots/hero-strike/meta";
import { meta as hubParticles } from "./slots/hub-particles/meta";
import { meta as manifestoReveal } from "./slots/manifesto-reveal/meta";
import { meta as mapRise } from "./slots/map-rise/meta";
import { meta as pathwayRun } from "./slots/pathway-run/meta";
import { meta as processLine } from "./slots/process-line/meta";
import { meta as standardBelt } from "./slots/standard-belt/meta";
import { meta as whynowPoints } from "./slots/whynow-points/meta";

/**
 * Enhanced slot code, split per slot and loaded only when the tier allows
 * and the slot is near the viewport (PRD 11.4). To replace a moment with the
 * owner's animation code, edit only that slot's Enhanced.tsx.
 */
export const enhanced: Record<SlotId, ComponentType<EnhancedProps>> = {
  "hero-strike": dynamic(() => import("./slots/hero-strike/Enhanced"), { ssr: false }),
  "manifesto-reveal": dynamic(() => import("./slots/manifesto-reveal/Enhanced"), { ssr: false }),
  "flagship-sticky": dynamic(() => import("./slots/flagship-sticky/Enhanced"), { ssr: false }),
  "hub-particles": dynamic(() => import("./slots/hub-particles/Enhanced"), { ssr: false }),
  "whynow-points": dynamic(() => import("./slots/whynow-points/Enhanced"), { ssr: false }),
  "process-line": dynamic(() => import("./slots/process-line/Enhanced"), { ssr: false }),
  "standard-belt": dynamic(() => import("./slots/standard-belt/Enhanced"), { ssr: false }),
  "expect-cards": dynamic(() => import("./slots/expect-cards/Enhanced"), { ssr: false }),
  "founder-counters": dynamic(() => import("./slots/founder-counters/Enhanced"), { ssr: false }),
  "pathway-run": dynamic(() => import("./slots/pathway-run/Enhanced"), { ssr: false }),
  "map-rise": dynamic(() => import("./slots/map-rise/Enhanced"), { ssr: false }),
  "doors-split": dynamic(() => import("./slots/doors-split/Enhanced"), { ssr: false }),
};

export const metas: Record<SlotId, SlotMeta> = {
  "hero-strike": heroStrike,
  "manifesto-reveal": manifestoReveal,
  "flagship-sticky": flagshipSticky,
  "hub-particles": hubParticles,
  "whynow-points": whynowPoints,
  "process-line": processLine,
  "standard-belt": standardBelt,
  "expect-cards": expectCards,
  "founder-counters": founderCounters,
  "pathway-run": pathwayRun,
  "map-rise": mapRise,
  "doors-split": doorsSplit,
};
