import type { ReactNode, RefObject } from "react";
import type { StrikePoint } from "@/content/media";

/** Device tiers (PRD 11.3). */
export type Tier = "A" | "B" | "C";

export const slotIds = [
  "hero-strike",
  "manifesto-reveal",
  "flagship-sticky",
  "hub-particles",
  "whynow-points",
  "process-line",
  "standard-belt",
  "expect-cards",
  "founder-counters",
  "pathway-run",
  "map-rise",
  "doors-split",
] as const;
export type SlotId = (typeof slotIds)[number];

/** meta.ts in each slot folder (PRD 11.4). */
export type SlotMeta = {
  id: SlotId;
  /** Lowest tier that gets the enhanced version. "A" means tier A only. */
  minTier: "A" | "B";
  needsWebGL: boolean;
  /** Load the enhanced bundle this far before the slot reaches the viewport. */
  preloadMargin: string;
};

/** Props every Enhanced.tsx receives (PRD 11.4). */
export type EnhancedProps = {
  containerRef: RefObject<HTMLElement | null>;
  tier: Exclude<Tier, "C">;
  reducedMotion: boolean;
  strikePoint?: { mobile: StrikePoint; desktop: StrikePoint };
};

export type DefaultProps = { children: ReactNode };
