import type { GlyphId } from "./activities";

/**
 * Custom single-weight activity glyphs on a 24 × 24 grid, drawn to match
 * Lucide's 1.5px stroke (PRD 10.7). The same paths feed the particle
 * targets in the hub (scripts/sample-glyphs.ts).
 */
export type GlyphShape =
  | { kind: "path"; d: string }
  | { kind: "circle"; cx: number; cy: number; r: number }
  | { kind: "rect"; x: number; y: number; width: number; height: number; rx: number };

export const glyphShapes: Record<GlyphId, GlyphShape[]> = {
  // A martial artist mid-punch, belt tied.
  karate: [
    { kind: "circle", cx: 7.5, cy: 4.5, r: 1.9 },
    { kind: "path", d: "M8.4 7.2 10.2 13.2" },
    { kind: "path", d: "M8.9 8.8 15.2 8.1 19.4 7.6" },
    { kind: "circle", cx: 20.3, cy: 7.5, r: 0.9 },
    { kind: "path", d: "M8.9 8.8 6 11.6 7.6 13" },
    { kind: "path", d: "M8.7 11.4 11.4 10.6" },
    { kind: "path", d: "M10.2 13.2 6.4 16.6 5.2 21" },
    { kind: "path", d: "M10.2 13.2 14.4 16 16.8 21" },
  ],
  // A chess knight on its base.
  chess: [
    { kind: "path", d: "M6.5 21h11" },
    { kind: "path", d: "M8 18h8.5" },
    {
      kind: "path",
      d: "M9 18c0-2.6 1.6-4.1 3.6-5.6l-3.4 1c-1 .3-2-.2-2.3-1.2l-.3-.9 5-5.6c1-1.1 2.5-1.7 4-1.4 2.2.4 3.4 2.4 3.4 4.6V18",
    },
    { kind: "circle", cx: 13.6, cy: 8.4, r: 0.6 },
  ],
  // A roller skate.
  skating: [
    { kind: "path", d: "M5 4.5h5.5v6.2l6.6 1.4c1.4.3 2.4 1.5 2.4 2.9V17H5z" },
    { kind: "path", d: "M10.5 7.5H8" },
    { kind: "path", d: "M10.5 10H8" },
    { kind: "circle", cx: 7.5, cy: 19.6, r: 1.6 },
    { kind: "circle", cx: 12.2, cy: 19.6, r: 1.6 },
    { kind: "circle", cx: 16.9, cy: 19.6, r: 1.6 },
  ],
  // A dancer in arabesque.
  ballet: [
    { kind: "circle", cx: 13.4, cy: 4, r: 1.8 },
    { kind: "path", d: "M12.9 6.6 11.4 13" },
    { kind: "path", d: "M6.6 6.2c2 1.4 4.2 1.8 6.3 1.2 2-.6 3.6-2 4.6-3.6" },
    { kind: "path", d: "M7.4 13.6c2.2 1 5.4 1 7.6 0" },
    { kind: "path", d: "M11.4 13 11.8 21" },
    { kind: "path", d: "M11.4 13 20.4 10.6" },
  ],
  // A leaping figure.
  dance: [
    { kind: "circle", cx: 15.6, cy: 4, r: 1.8 },
    { kind: "path", d: "M14.6 6.8 11.2 12.4" },
    { kind: "path", d: "M6.4 5.2 13.4 8.4 19.6 6.4" },
    { kind: "path", d: "M11.2 12.4 4.6 14.6" },
    { kind: "path", d: "M11.2 12.4 13.6 16.4 12.4 21" },
  ],
  // Two quavers.
  music: [
    { kind: "path", d: "M9 18V5.4l11-2.2V16" },
    { kind: "path", d: "M9 9.2l11-2.2" },
    { kind: "circle", cx: 6.5, cy: 18, r: 2.5 },
    { kind: "circle", cx: 17.5, cy: 16, r: 2.5 },
  ],
  // A robot head.
  coding: [
    { kind: "rect", x: 4.5, y: 8, width: 15, height: 11.5, rx: 2.5 },
    { kind: "path", d: "M12 8V5.4" },
    { kind: "circle", cx: 12, cy: 4.2, r: 1.2 },
    { kind: "path", d: "M9.4 12.6v1.4" },
    { kind: "path", d: "M14.6 12.6v1.4" },
    { kind: "path", d: "M9.8 16.6h4.4" },
    { kind: "path", d: "M2.5 12.5v3" },
    { kind: "path", d: "M21.5 12.5v3" },
  ],
};

/** Order of glyphs in public/media/particles.bin (scripts/sample-glyphs.ts). */
export const particleGlyphOrder: GlyphId[] = ["karate", "chess", "skating", "ballet", "dance", "music", "coding"];
export const PARTICLE_POINTS = 4096;
