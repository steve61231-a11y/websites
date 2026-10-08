---
name: update-images
description: Replace or add images on the platform: course cover, day/lesson thumbnails, the instructor's photo, the logo or the sign-in photo. Use when the user provides photos or asks to change any picture.
---

# Update images

All paths are relative to `course-platform/`. Images live in `public/` and are referenced by URL path (`/stills/day-2.jpg` = `public/stills/day-2.jpg`).

| What | File / setting | Size (landscape unless noted) |
|---|---|---|
| Course cover (catalog card, course page poster) | `cover` in `src/lib/content/the-prod/index.ts` | 2400×1350 |
| Course page hero poster (shown before the 3D studio loads, and on phones/no-WebGL) | `public/stills/hero.jpg`, `public/stills/hero-portrait.jpg` (portrait 1080×1920) | 2400×1350 |
| Day covers (course home, lesson list, player poster) | `still` on each module in `src/lib/content/the-prod/index.ts`; files in `public/stills/` | 1920×1080 |
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
