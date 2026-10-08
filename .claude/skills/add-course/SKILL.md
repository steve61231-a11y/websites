---
name: add-course
description: Add a new course to the school (the home page catalog). Use when the user wants a second course, a "coming soon" course, or to duplicate THE PROD's structure for new content.
---

# Add a course

All paths are relative to `course-platform/`. The home page (`/`) lists every course in `courses` (`src/lib/catalog.ts`); each gets a page at `/courses/<slug>`.

## Steps

1. Copy the folder: `src/lib/content/the-prod/` → `src/lib/content/<new-slug>/`. Rename the export in `index.ts` (e.g. `export const videoCreation: Course = {…}`) and set unique `id`, `slug` and `code` (`code` goes into certificate numbers, e.g. `VID`).
2. Fill in the course details, modules (days), lessons and quizzes (see `edit-lessons-and-quizzes`). Quiz ids must be unique across courses (prefix them, e.g. `vid-q-day-1`).
3. Set `status: "coming_soon"` while it isn't ready.
4. Add it to `courses` in `src/lib/catalog.ts`.
5. Transcripts go in `content/transcripts/<course-id>/`.
6. Add a cover image (`update-images`).

## Current limits (tell the user)

The **learning area** (`/learn/...`), checkout and the account demo controls are still built for one course: they use `course` from `src/lib/catalog.ts`. A second *published* course needs:

- course-scoped learning routes (`/learn/[course]/[episode]/[lesson]`) instead of `/learn/[episode]/[lesson]`, with `course` passed down rather than imported;
- `/enroll?course=<slug>` and per-course enrollment (the demo store already tracks `enrolled` as a list of course ids);
- `coming_soon` handling on the catalog card (show "Coming soon" and no enrol button).

Plan that change with the user before doing it; it touches most files under `src/app/learn`.
