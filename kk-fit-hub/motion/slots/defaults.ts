import type { ComponentType } from "react";
import type { DefaultProps, SlotId } from "../types";
import DoorsSplit from "./doors-split/Default";
import ExpectCards from "./expect-cards/Default";
import FlagshipSticky from "./flagship-sticky/Default";
import FounderCounters from "./founder-counters/Default";
import HeroStrike from "./hero-strike/Default";
import HubParticles from "./hub-particles/Default";
import ManifestoReveal from "./manifesto-reveal/Default";
import MapRise from "./map-rise/Default";
import PathwayRun from "./pathway-run/Default";
import ProcessLine from "./process-line/Default";
import StandardBelt from "./standard-belt/Default";
import WhynowPoints from "./whynow-points/Default";

/** Server-safe default for every slot. */
export const slotDefaults: Record<SlotId, ComponentType<DefaultProps>> = {
  "hero-strike": HeroStrike,
  "manifesto-reveal": ManifestoReveal,
  "flagship-sticky": FlagshipSticky,
  "hub-particles": HubParticles,
  "whynow-points": WhynowPoints,
  "process-line": ProcessLine,
  "standard-belt": StandardBelt,
  "expect-cards": ExpectCards,
  "founder-counters": FounderCounters,
  "pathway-run": PathwayRun,
  "map-rise": MapRise,
  "doors-split": DoorsSplit,
};
