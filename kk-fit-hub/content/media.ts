/**
 * Photo slots (PRD section 9). Until a photo exists, layouts show a plain dark
 * placeholder; never stock photos of other people.
 *
 * To add a photo: process it (scripts/process-photos.ts), put the files in
 * public/media/, then set `src`, `width` and `height` below. For the strike
 * cutout also record `strikePoint` (the fist position as % of the image) for
 * the mobile and desktop crops.
 */

export type PhotoId =
  | "kennedy-strike"
  | "kennedy-portrait"
  | "kennedy-teaching"
  | "kennedy-action-2"
  | "detail-belt"
  | "class-wide";

export type StrikePoint = { x: number; y: number };

export type Photo = {
  id: PhotoId;
  alt: string;
  /** Path under /public, e.g. "/media/kennedy-strike-1920.webp". null until supplied. */
  src: string | null;
  width: number;
  height: number;
  strikePoint?: { mobile: StrikePoint; desktop: StrikePoint };
};

// CONFIRM: original punch photo at full resolution, plus the shoot in section 9 (open item 16).
export const photos: Record<PhotoId, Photo> = {
  "kennedy-strike": {
    id: "kennedy-strike",
    alt: "Kennedy Kopala, founder of KK Fit Hub, throwing a punch",
    src: null,
    width: 1600,
    height: 2000,
    // Placeholder positions until the cutout exists: the fist reaches toward the text.
    strikePoint: { mobile: { x: 30, y: 38 }, desktop: { x: 12, y: 42 } },
  },
  "kennedy-portrait": {
    id: "kennedy-portrait",
    alt: "Kennedy Kopala in his karate uniform and black belt",
    src: null,
    width: 1600,
    height: 2000,
  },
  "kennedy-teaching": {
    id: "kennedy-teaching",
    alt: "Kennedy Kopala coaching a karate session",
    src: null,
    width: 1920,
    height: 1440,
  },
  "kennedy-action-2": {
    id: "kennedy-action-2",
    alt: "Kennedy Kopala demonstrating a Kenpo Karate technique",
    src: null,
    width: 1600,
    height: 2000,
  },
  "detail-belt": {
    id: "detail-belt",
    alt: "Hands tying a black belt",
    src: null,
    width: 1920,
    height: 1280,
  },
  "class-wide": {
    id: "class-wide",
    alt: "Learners in a KK Fit Hub karate session",
    src: null,
    width: 1920,
    height: 1080,
  },
};

/** The flagship section uses the teaching shot, or kennedy-action-2 if none exists. */
export function flagshipPhoto(): Photo {
  return photos["kennedy-teaching"].src ? photos["kennedy-teaching"] : photos["kennedy-action-2"];
}
