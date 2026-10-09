---
name: add-videos
description: Connect lesson videos (and downloadable files like the gear-list PDF) to the course. Use when the user has uploaded or wants to upload course videos, has video links to add, wants to replace a video, or has a PDF/checklist to attach to a lesson.
---

# Add lesson videos and downloads

All paths are relative to `course-platform/`.

Every lesson is identified by its video number, e.g. `2.3` (Day 2, video 3). Links go in **one file per course**: `src/lib/content/the-prod/media.ts`.

```ts
export const videos: Record<string, string> = {
  "0.1": "https://vz-abc123.b-cdn.net/2f6c…/play_720p.mp4",
  "2.3": "https://…/2-3.mp4",
};

export const resources: Record<string, Resource[]> = {
  "2.8": [{ title: "Gear list", kind: "PDF", href: "/downloads/the-prod/gear-list.pdf" }],
};
```

- A lesson with a link plays that video in the course player (our controls, watermark, resume and auto-complete at the end all work). A lesson without one keeps the stand-in player, so the course still works while videos trickle in.
- `kind` is one of `PDF`, `Checklist`, `Preset`, `Link`. Downloads show under the lesson notes.

## Where to host videos

Never commit video files to git (they are hundreds of MB). Use a video host and paste its URL:

1. **Bunny Stream** (recommended, cheap, fast in Africa): create a library, upload, enable *MP4 fallback* in the library settings, then copy the `play_720p.mp4` URL for each video.
2. **Mux** or **Cloudflare Stream** also work; use their MP4/static rendition URL.
3. Any public MP4 URL works for testing (e.g. Google Drive does NOT stream reliably; avoid it).

Phase 4 swaps public URLs for short-lived signed URLs from the server, so the link format may change then; the `videos` map stays the place to set them.

Small files (PDFs, checklists) can go in `public/downloads/<course>/` and be linked as `/downloads/<course>/<file>`.

## Video lengths

The course uses each lesson's `seconds` (in `src/lib/content/the-prod/<day>.ts`, the third argument of `lesson(...)`) for the "8 videos · 22 min" totals. The player reads the real length from the file, but update `seconds` if a re-edit changes a video's length noticeably.

## Matching videos to numbers

The client's video files are named like `2.3 - Camera Sensor - FullFrame or Cropped`. The number before the dash is the key. The original "6.2 - Shooting Two Lights" is not used; the two "Revised" videos are now **6.2** (Shooting Two Lights: Setup) and **6.3** (Shooting Two Lights). The conclusion video is `8.1`.

## After adding

Run the `check-and-publish` skill: it verifies the build and refreshes the preview link. Note the shareable single-file preview cannot embed real videos; it only plays them if the URLs are public.
