import type { Resource } from "../../types";

// Videos and downloads for THE PROD, keyed by video number ("2.3").
//
// Course videos don't go here. Drop them in the Google Drive inbox: the
// GitHub Action encrypts each one, uploads it and lists it in streams.json,
// and the lesson then plays it as a protected stream (that always wins over
// a link below). A link here is only for a plain, unprotected file anyone
// with the URL can download, e.g. a free preview. A number in neither keeps
// the stand-in player. See .claude/skills/add-videos.

export const videos: Record<string, string> = {
  // "0.1": "https://media.example.com/previews/0.1.mp4",
};

export const resources: Record<string, Resource[]> = {
  // "2.8": [{ title: "Gear list", kind: "PDF", href: "/downloads/the-prod/gear-list.pdf" }],
};
