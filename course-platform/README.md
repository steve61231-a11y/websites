# Lumen — course platform

Phase 1 of the course platform described in the PRD: the complete visual product, running on realistic sample data, so the client can experience it before payments, auth and video are connected.

```bash
npm install
npm run dev        # http://localhost:3000
```

## The walkthrough

1. **Home** → *Explore courses* → **Photography & Camera Masterclass**
2. **Enroll** → name + email → demo payment (M-Pesa or card) → watch the payment get verified → the access email
3. **Begin learning** → email → any 6-digit code
4. **Your path**: progress dial, *Up next*, and the seven-module journey (later modules locked)
5. **Lesson player**: plays a simulated video with captions, a viewer watermark, resume position, and speed up to 8× for demos. *Mark as complete* or let it finish → *Up next* countdown
6. Finish a module's lessons → **quiz** (one question per screen, instant feedback) → pass → confetti, the dial fills, next module unlocks
7. Pass the final assessment → **"You did it."** → certificate → Download PDF (print) / Share
8. **/verify** checks any certificate ID (try `CERT-2026-PHOTO-000142`)

Shortcuts: on the login page, *continue as an enrolled student*. On **Profile → Demo controls** you can jump to the middle or the final module, or reset everything. Demo state lives in `localStorage`.

## Design

Apple-inspired and restrained: system fonts (SF on Apple devices, Inter elsewhere), lots of whitespace, one blue for actions, green for completion, and gold kept only for the certificate.

- **The lens.** The course's "product shot" is a rendered SVG lens whose aperture blades open as the page loads, and open further while a lesson plays. It needs no photography to look premium.
- **The progress dial.** Progress is a ring split into one arc per module, like a camera's mode dial. Each arc fills as you go, and the current module glows softly.
- **One next step.** Every learner screen leads with a single obvious action (*Continue*, *Take the quiz*, *View certificate*). There are no sidebars; the lesson list is a slide-over.
- **Earned moments.** A check mark draws itself for a finished lesson. Confetti appears only when a module is passed. The final screen is dark, gold and cinematic.
- **Mobile first.** A bottom tab bar for learners, a sticky action bar in the player, bottom-sheet feedback in quizzes, and large tap targets.

## Structure

```
src/lib/types.ts        domain types (mirror the Supabase tables)
src/lib/catalog.ts      sample course: 7 modules, 20 lessons, 7 quizzes
src/lib/progress.ts     pure rules: unlocking, % complete, next step, eligibility
src/lib/demo-store.ts   Phase 1 persistence (swapped for Supabase in Phase 2)
src/components/         lens art, dial, player, certificate, celebration, nav
src/app/                routes: /, /courses, /courses/[slug], /checkout/[slug],
                        /login, /dashboard, /learn/[slug], /learn/[slug]/[lesson],
                        /learn/[slug]/quiz/[module], /learn/[slug]/complete,
                        /certificates, /certificates/[number], /verify, /profile
supabase/migrations/    Phase 2 schema with Row Level Security
```

Nothing assumes one course or seven modules. Add a course to `catalog.ts` (later, a row in `courses`) and it appears everywhere.

## What's simulated in Phase 1

| Demo | Production (later phases) |
| --- | --- |
| Payment sheet + verification steps | Paystack checkout → webhook → verify → enrollment row → access email |
| Any OTP code works | Supabase Auth email OTP; entitlement checked server-side |
| Locks enforced in the browser | Same `progress.ts` rules run on the server; RLS on every table |
| Quiz graded in the browser | Server-side grading; `is_correct` never reaches the client |
| Lens animation in the player | Mux / Bunny / Cloudflare Stream with signed, expiring playback |
| Certificate printed to PDF | Server-generated PDF, emailed, stored, publicly verifiable |
