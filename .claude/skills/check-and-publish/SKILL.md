---
name: check-and-publish
description: Verify the platform after any change (lint, typecheck, build, click-through in both themes) and refresh the shareable preview link, then commit. Use after editing content, images or code, or when the user asks to see the latest version or for a link.
---

# Check and publish

All commands run in `course-platform/`.

## 1. Checks

```bash
npx eslint src            # warnings about <img> are expected
npx tsc --noEmit -p .
npm run build             # must list /learn/<day>/<video> pages without errors
```

Read `AGENTS.md`: this Next.js version differs from older docs; check `node_modules/next/dist/docs/` before changing routing or caching code.

## 2. Click through

`npx next start -p 3200`, then with Playwright (Chromium is preinstalled; don't run `playwright install`) visit, in **dark and light** (set `localStorage["the-prod-theme"]` to `"light"` before load):

- `/` home catalog → `/courses/the-prod?still` (`?still` skips WebGL)
- `/sign-in` → "Continue with Google" (demo sign-in) → `/learn`
- a lesson, its **Transcript** tab, and a quiz
- `/account` → Demo controls → "Jump to the wrap-up" to reach the final assessment

Look at the screenshots, desktop (1440×900) and phone (390×844). Stop the server afterwards by PID (`ps aux | grep "next start"`), not `pkill -f`.

## 3. Shareable preview link

```bash
npm run preview:artifact   # builds preview/dist/index.html and preview/dist/artifact.html
```

Publish `preview/dist/artifact.html` with the Artifact tool **to the existing link** (`url: https://claude.ai/artifact/7Qup3NbXYABwAKnREms7gE`) so the client's link keeps working. The preview is a one-file Vite build of the same screens with an in-memory router (`preview/main.tsx`): when you add a route in `src/app`, add it to the `routes` table there too.

## 4. Commit

Commit on the working branch with a plain description of what changed for the client (content, images, behaviour) and push.
