# THE PROD

The learning platform for **THE PROD: E-commerce Product Photography with AI**, a seven-day course by Product Photography Kenya. This is the clickable prototype, running on the real course outline with sample progress, payments and video, so the client can judge the experience before the backend is connected.

```bash
npm install
npm run dev              # http://localhost:3000
npm run preview:build    # one-file shareable preview in preview/dist/index.html
```

## The journey

1. **Landing** (`/`): a live 3D product studio. The bottle turns matte, reflective, transparent and translucent as you scroll, straight from Day 1. Then the seven-day filmstrip, how we help, Duncan and his clients, pricing and FAQ.
2. **Get access** (`/enroll`): name and email, then M-Pesa or card, the "check your phone" step, and the payment verification steps.
3. **Welcome** (`/welcome`): the branded access email.
4. **Sign in** (`/sign-in`): email and a 6-digit code, or Google. In the demo any code works and Google signs in a sample student.
5. **Course home** (`/learn`): what's next, overall progress, and the nine-episode path. Later days unlock as each quiz is passed.
6. **Lesson** (`/learn/day-1`): the thumbnail morphs into the player. Lesson notes are written from the course summary.
7. **Quiz** (`/learn/day-1/quiz`): one question per screen with instant feedback. Passing unlocks the next day.
8. **Certificate** (`/learn/complete`, `/certificate/[id]`, `/verify`).

On **Account → Demo controls** you can jump to Day 4 or the wrap-up, or reset everything.

## Structure

```
brand/                       THE PROD wordmark as vector files
public/stills/               episode covers rendered from the 3D studio
src/lib/catalog.ts           course content: welcome, days 1–7, wrap-up, quizzes
src/lib/progress.ts          unlock and completion rules (shared with the server in Phase 2)
src/lib/demo-store.ts        prototype persistence; becomes Supabase in Phase 2
src/components/studio/       the real-time 3D product studio
src/components/landing/      landing sections
src/components/learn/        player, notes, episode covers, certificate
src/app/                     routes
supabase/migrations/         Phase 2 schema with row-level security
preview/                     single-file build for sharing a link
```

## Still needed from the client

- Final video files, durations and transcripts (quizzes will be rewritten from the transcripts)
- Price (KES 15,000 is a placeholder), the WhatsApp number to confirm, and the booking calendar link
- Instructor photo
