# THE PROD

The online school for **Product Photography Kenya**. Its first course is **THE PROD: E-commerce Product Photography with AI**: seven days, 32 videos, a quiz each day and a final assessment. This is the clickable prototype. It runs on the real course content, with sample progress, payments and a stand-in video player, so the client can judge the experience before the backend is connected.

```bash
npm install
npm run dev                # http://localhost:3000
npm run preview:artifact   # one-file shareable preview in preview/dist/
```

## The journey

1. **Home** (`/`): what the school is and the course catalog. There's one course for now, plus a "more on the way" card.
2. **Course page** (`/courses/the-prod`): a camera viewfinder shows the course in one loop (settings dial in, click, the shot goes live in a store), then the curriculum, outcomes, instructor, pricing and FAQ.
3. **Get access** (`/enroll`): name and email, then M-Pesa or card. A receipt printer confirms the payment and prints the receipt. **Welcome** (`/welcome`) shows the access email and the plain receipt email (`src/lib/receipt.ts` builds both the on-screen receipt and the email).
4. **Sign in** (`/sign-in`): email and a 6-digit code, or Google. In the demo any code works.
5. **Course home** (`/learn`): what's next and overall progress. Each day opens to show its videos and quiz.
6. **Lesson** (`/learn/day-2/2-3`): the player, the notes, and the full transcript. Finishing a video moves you on to the next one, then to the day's quiz.
7. **Quiz** (`/learn/day-2/quiz`): one question per screen with instant feedback. Passing unlocks the next day.
8. **Certificate** (`/learn/complete`, `/certificate/[id]`, `/verify`): the student confirms their name, and their certificate is drawn from the template (`public/certificates/the-prod.jpg` plus `src/lib/content/the-prod/certificate.ts`) and can be downloaded or shared.

Light and dark mode: the sun/moon button in every top bar switches theme. Dark is the default, and the choice is remembered on the device.

On **Account → Demo controls** you can jump to Day 4 or the wrap-up, or reset everything.

## Structure

```
content/transcripts/the-prod/   one transcript per video (2-3.md = video 2.3)
content/REVIEW.md               transcript points for the client to confirm
src/lib/content/the-prod/       the course: index.ts (details, days), day files (notes + quiz), media.ts (video links, downloads)
src/lib/catalog.ts              school details (WhatsApp, email…) and the list of courses
src/lib/progress.ts             unlock and completion rules (shared with the server in Phase 2)
src/lib/demo-store.ts           prototype persistence; becomes Supabase in Phase 2
src/components/home/            home page catalog
src/components/course/          course page sections and the 3D studio hero
src/components/learn/           player, notes, covers, certificate
src/components/theme-toggle.tsx light/dark switch
src/app/                        routes
scripts/                        transcript import, thumbnail import, frame grabs, preview packaging
supabase/migrations/            Phase 2 schema with row-level security
docs/BACKEND-PLAN.md            backend, payments, video protection and security plan
preview/                        single-file build for sharing a link
```

## Day-to-day changes

Skills in `/.claude/skills` walk Claude through each routine job:

| Skill | For |
|---|---|
| `add-videos` | paste video links and PDFs per lesson |
| `update-images` | video thumbnails from screenshots, day covers, instructor photo |
| `update-transcripts` | import a new transcript export, or fix words |
| `edit-lessons-and-quizzes` | notes, video titles, quiz questions |
| `edit-course-details` | price, day names, WhatsApp, FAQs, home page text |
| `add-course` | a second course in the catalog |
| `update-certificate` | swap in a new certificate design (e.g. from Canva) and position the name/date |
| `check-and-publish` | checks, click-through, refresh the preview link, commit |

## Still needed from the client

- Video uploads to a DRM video host (see `docs/BACKEND-PLAN.md`) and the gear-list PDF
- The certificate template from Canva (see the `update-certificate` skill)
- The points in `content/REVIEW.md`
- Price (KES 15,000 is a placeholder), the WhatsApp number to confirm, the booking calendar link
