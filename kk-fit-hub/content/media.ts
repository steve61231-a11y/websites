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
  "kennedy-strike" | "kennedy-portrait" | "kennedy-teaching" | "kennedy-action-2" | "detail-belt" | "class-wide";

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
    // CONFIRM: interim cutout from the studio stance photo, until the punch photo arrives.
    alt: "Kennedy Kopala, founder of KK Fit Hub, in a Kenpo fighting stance",
    src: "/media/kennedy-strike-1920.webp",
    width: 1066,
    height: 1600,
    // The guard fist, as % of the image.
    strikePoint: { mobile: { x: 58, y: 27 }, desktop: { x: 58, y: 27 } },
  },
  "kennedy-portrait": {
    id: "kennedy-portrait",
    alt: "Kennedy Kopala in his karate uniform and black belt",
    src: "/media/kennedy-stance-1920.webp",
    width: 1066,
    height: 1600,
  },
  "kennedy-teaching": {
    id: "kennedy-teaching",
    alt: "Kennedy Kopala speaking at a karate event",
    src: "/media/kennedy-event-1920.webp",
    width: 715,
    height: 536,
  },
  "kennedy-action-2": {
    id: "kennedy-action-2",
    alt: "Kennedy Kopala demonstrating a Kenpo Karate stance",
    src: "/media/kennedy-stance-1920.webp",
    width: 1066,
    height: 1600,
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
