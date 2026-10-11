---
name: add-videos
description: Connect lesson videos (and downloadable files like the gear-list PDF) to the course. Use when the user has uploaded or wants to upload course videos, has video links to add, wants to replace a video, or has a PDF/checklist to attach to a lesson.
---

# Add lesson videos and downloads

All paths are relative to `course-platform/`. Owner-facing steps: `docs/VIDEO-SETUP.md`.

## Protected videos (the normal way)

Pipeline: Google Drive folder → GitHub Action `.github/workflows/package-videos.yml` (repo root) → encrypted HLS in Cloudflare R2 → `src/lib/content/the-prod/streams.json` → the player plays it via our key server (`src/app/api/video/**`).

This sandbox can't reach Drive or R2, but GitHub Actions can. Don't try to download videos here.

1. **Folder link.** Put the Drive folder URL in `content/videos/the-prod.json` (`{"driveFolder": "https://drive.google.com/drive/folders/…"}`), commit and push. The folder must be shared "Anyone with the link". Files must start with the lesson number (`2.3 …`).
2. **Run the job.** GitHub MCP `actions_run_trigger` → workflow `package-videos.yml`, ref = the current branch, inputs: `course` (default `the-prod`), optional `only` (`2.3,2.4`), `force` (re-package even if unchanged). It also runs nightly.
3. **Watch it.** `actions_list` / `get_job_logs`. The plan job lists what it will package; each video is its own job; the publish job commits `streams.json` to the branch.
4. **Pull** the branch (`git pull origin <branch>`), then run `check-and-publish`. Lessons with an entry in `streams.json` play the real video automatically.

Troubleshooting:
- "Can't list the folder" / empty → folder not shared, wrong link, or more than 50 files in it.
- "Too many users have viewed or downloaded" → Drive download quota; wait a few hours and re-run with `only`.
- "Missing secret …" → the owner hasn't added the GitHub secrets (docs/VIDEO-SETUP.md step 2).
- A file skipped as "doesn't start with a lesson number" → ask the owner to rename it.
- Replaced a video → a new Drive file is detected automatically; same file edited in place → re-run with `only` + `force`.

Tests (run after touching any of this): `node scripts/video/test-server.ts` (seconds) and `node scripts/video/selftest.ts` (~5 min, real ffmpeg encode + fingerprint recovery). Add `--disable-warning=MODULE_TYPELESS_PACKAGE_JSON` to quiet Node.

Testing playback locally: package a clip with `node scripts/video/package.ts --input clip.mp4 --course the-prod --code 0.1 --out /tmp/out` (env `VIDEO_SECRET`), serve `/tmp/out` with CORS, put its `meta.json` entry (minus course/code) into `streams.json` temporarily, run the app with `VIDEO_SECRET`, `VIDEO_CDN_URL`, `VIDEO_DEV_OPEN=1`. Playwright's Chromium can't decode H.264, so check network/keys there and real playback in a real browser. Restore `streams.json` afterwards.

## Leak tracing

The owner sends a leaked file. Get the original source video, then:
`node scripts/video/trace-leak.ts --leak leak.mp4 --source original.mp4 [--offset seconds]`. It prints the most likely watermark ids; map the id to a student via `profiles.watermark_id` (Phase 2).

## Plain links (fallback, unprotected)

`src/lib/content/the-prod/media.ts` → `videos["2.3"] = "https://…mp4"`. A `streams.json` entry wins over this.

## Downloads (PDFs, checklists)

Put the file in `public/downloads/the-prod/`, then in `media.ts`:

```ts
export const resources: Record<string, Resource[]> = {
  "2.8": [{ title: "Gear list", kind: "PDF", href: "/downloads/the-prod/gear-list.pdf" }],
};
```
