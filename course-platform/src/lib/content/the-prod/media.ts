import type { Resource } from "../../types";

// Videos and downloads for THE PROD, keyed by video number ("2.3").
// Paste a link next to a number and that lesson plays it; leave a number out
// and the lesson keeps the stand-in player. See .claude/skills/add-videos.

export const videos: Record<string, string> = {
  // "0.1": "https://vz-xxxx.b-cdn.net/<video-id>/play_720p.mp4",
};

export const resources: Record<string, Resource[]> = {
  // "2.8": [{ title: "Gear list", kind: "PDF", href: "/downloads/the-prod/gear-list.pdf" }],
};
