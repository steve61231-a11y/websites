---
name: update-images
description: Replace or add images on the platform: video thumbnails (screenshots from the videos), day covers, course cover, the instructor's photo, the logo or the sign-in photo. Use when the user provides photos or screenshots, shares a folder of thumbnails, or asks to change any picture.
---

# Update images

## Video thumbnails, day covers, course cover (the usual job)

The client sends screenshots from the videos. **Names decide where they go:** `2.3.png` (or `2.3 - Camera Sensor.jpg`) → video 2.3; `day-2.jpg` → Day 2 cover; `welcome.jpg` / `wrap-up.jpg` → Introduction / Conclusion; `cover.jpg` → course card and page.

```bash
node scripts/import-thumbnails.mjs <folder-with-images> the-prod
```

It crops to 16:9, resizes to 1280×720, saves to `public/thumbs/the-prod/`, and regenerates `src/lib/content/the-prod/thumbnails.ts` (don't edit that file by hand). Lessons without a thumbnail keep their day cover. Re-running adds or replaces only what you pass.

**Getting the images without uploading them in chat** (chat uploads eat usage):
1. **Google Drive** (best): the user puts the images in a Drive folder and tells you its name. Use the Google Drive connector to find the folder and download each file into a new empty folder in your scratchpad, then run the script on it.
2. **GitHub**: the user drags the files into `course-platform/public/thumbs/incoming/` on the working branch (github.com → Add file → Upload files). Pull, run the script on that folder, then delete `incoming/`.
3. **From the videos**: if you can get the video files, `scripts/grab-frames.sh <videos> <out> [seconds]` grabs a frame from each (ffmpeg is installed); then run the import on `<out>`.

Download user files into their own empty folder and pass paths as arguments; never run anything from inside it.

## Everything else

All paths are relative to `course-platform/`. Images live in `public/` and are referenced by URL path (`/stills/day-2.jpg` = `public/stills/day-2.jpg`).

| What | File / setting | Size (landscape unless noted) |
|---|---|---|
| Course cover (catalog card) | `cover.jpg` via the import script above (fallback: `cover` in `src/lib/content/the-prod/index.ts`) | 2400×1350 |
| Course page hero poster (shown before the 3D studio loads, and on phones/no-WebGL) | `public/stills/hero.jpg`, `public/stills/hero-portrait.jpg` (portrait 1080×1920) | 2400×1350 |
| Day covers (course home, lesson list, player poster) | `day-N.jpg` via the import script above (fallback: `still` on each module in `index.ts`, files in `public/stills/`) | 1920×1080 |
| Instructor photo | `instructor.photo` in `src/lib/content/the-prod/index.ts`, e.g. `"/people/duncan.jpg"` | portrait 1200×1500 |
| Sign-in / checkout side photo | `image` prop where `AuthShell` is used (`src/app/sign-in`, `src/app/enroll`) | 1600×2000 |
| Logo | `src/components/brand/wordmark-paths.ts` (vector paths) and `brand/*.svg` | vector |

## Steps

1. Save the image into `public/` (keep `.jpg` for photos, `.png`/`.svg` for graphics). Use lowercase, dash-separated names.
2. Compress it: aim for under 400 KB. With ImageMagick: `magick in.jpg -resize 2400x -quality 82 -strip out.jpg`.
3. Point the setting above at it (or overwrite the existing file with the same name to change it everywhere).
4. Product photos are dark studio shots; images sit on dark overlays in both light and dark mode, so very bright images may need a darker edit for white text to read.
5. Run `check-and-publish`.

The shareable preview inlines every `/stills/*.jpg` referenced in code (see `preview/vite.config.ts`). Images outside `public/stills/` are NOT inlined, so put preview-critical images in `public/stills/`.
