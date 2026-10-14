# KK Fit Hub website

The public site and private admin for KK Fit Hub, built from the Website PRD v1. Next.js (App Router) on Vercel,
Supabase (Postgres, Auth, Storage) for data, Tailwind for styling.

Facts still waiting on Kennedy are listed in [CONFIRMATIONS.md](./CONFIRMATIONS.md) and marked `CONFIRM` in code.

## What's here

| Area           | Where                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------- |
| Public pages   | `app/(site)/`: Home, Programmes, Kenpo Karate, For Schools, Join, About, Contact, Privacy |
| Forms          | `components/forms/`, server actions in `actions/public.ts`, schemas in `lib/validation/`  |
| Admin          | `app/admin/`, actions in `actions/admin.ts`, access checks in `lib/admin/dal.ts`          |
| Copy           | `content/` (PRD copy, word for word). Activities, roles and settings also live in the DB  |
| Database       | `supabase/migrations/` (schema, RLS, triggers, RPCs), `supabase/seed.sql`                 |
| Motion         | `motion/`: tiers, the provider and 12 named slots (`motion/slots/<id>/`)                  |
| Scheduled jobs | `app/api/cron/*`, scheduled in `vercel.json`                                              |
| Tests          | `tests/` (Playwright), `lib/**/*.test.ts` and `supabase/tests/` (Vitest)                  |

## Setup

Requires Node 22+.

```bash
npm install
cp .env.example .env.local   # fill in; see the comments in the file
npm run dev
```

Without Supabase variables the public pages still render from the seed content in `content/`; the forms and admin
need a database.

### Local database

With Docker: `npx supabase start`, then `npx supabase db reset` applies `supabase/migrations` and `supabase/seed.sql`.
Copy the printed URL and keys into `.env.local`.

Without Docker, `npm run stack:start` runs a local stand-in (Postgres 16, Supabase Auth, PostgREST, a storage
stand-in and a gateway on `:54321`) and writes its variables to `.stack/env`:

```bash
npm run stack:start
set -a; source .stack/env; set +a   # before dev, build, start and tests
npm run stack:stop
```

`NEXT_PUBLIC_*` values are built into the pages, so source the env **before** `next build`.

After a schema change, regenerate types with `npm run db:types` (needs `DATABASE_URL`).

## Commands

| Command                         | What it does                                                                   |
| ------------------------------- | ------------------------------------------------------------------------------ |
| `npm run dev`                   | Development server                                                             |
| `npm run lint` / `typecheck`    | ESLint / TypeScript                                                            |
| `npm test`                      | Vitest: phone and format helpers, plus RLS tests against the local database    |
| `npm run test:e2e`              | Playwright on mobile, tablet and desktop, then the admin suite (needs a build) |
| `npm run test:lighthouse`       | Lighthouse CI budgets (`lighthouserc.json`)                                    |
| `npm run invite -- …`           | Create a staff member or the first owner (below)                               |
| `npm run photos -- <file> <id>` | Export a graded photo to AVIF/WebP for the site (below)                        |
| `npm run build:map`             | Rebuild `content/kenya-map.json` from county boundaries                        |
| `npm run build:particles`       | Rebuild `public/media/particles.bin` from the activity glyphs                  |

The E2E suite needs test staff accounts in the database:

```bash
npm run invite -- --email owner@kk.test --name "Kennedy Kopala" --role owner --password owner-password-123
npm run invite -- --email staff@kk.test --name "Amina Staff" --role staff --password staff-password-123
npx next build && npx playwright test
```

CI runs all of this in `.github/workflows/kk-fit-hub.yml`.

## Deploying

1. **Supabase.** Create a project. Run `npx supabase link` and
   `npx supabase db push` to apply the migrations, then run `supabase/seed.sql` in the SQL editor. In Auth settings,
   turn off public sign-ups, enable TOTP multi-factor, and set the Site URL to the live domain.
2. **Vercel.** Import the repo with root directory `kk-fit-hub`. Set every variable from `.env.example` for
   Production and Preview. Previews should use the Turnstile test keys and, ideally, a separate Supabase project.
3. **Crons.** `vercel.json` schedules retention (00:30 UTC), upload cleanup (every 6 hours) and the daily digest
   (04:45 UTC, 07:45 in Nairobi). Set `CRON_SECRET`. The Vercel Hobby plan only allows daily crons, so on Hobby
   change the upload cleanup to once a day.
4. **First owner.** With the production variables in your shell, run
   `npm run invite -- --email <kennedy's email> --name "Kennedy Kopala" --role owner`. It prints a one-time link.
   Kennedy sets a password and then two-factor sign-in, which every owner action requires.
5. **Domain and email.** Add the domain in Vercel and set `NEXT_PUBLIC_SITE_URL`. Once the Resend domain is
   verified, set `RESEND_API_KEY` and `EMAIL_FROM` and turn on alerts in Admin → Settings.

## Photos

Photos are dark placeholders until the shoot (PRD 9). For each photo, grade it first, then run:

```bash
npm run photos -- ~/kennedy-strike.png kennedy-strike
```

Then, in `content/media.ts`, set that id's `src`, `width` and `height`, and for the strike photo its `strikePoint`
(where the fist lands, as fractions of the frame, on mobile and desktop).

## Replacing a motion moment

Each animated moment is a slot in `motion/slots/<id>/` with three files:

- `Default.tsx` is the static version everyone gets first, and the only one on tier C or with reduced motion.
- `Enhanced.tsx` is loaded later, only when the device tier allows it and the slot is near the viewport.
- `meta.ts` sets the lowest tier, whether WebGL is needed, and how early to load.

To replace a moment, edit only that slot's `Enhanced.tsx`. It receives `containerRef` (the slot's element),
`tier`, `reducedMotion` and, for the hero, `strikePoint`. GSAP comes from `loadGsap()` in `motion/useGsap.ts`;
3D scenes use the shared canvas (`motion/SharedCanvas.tsx`) through drei's `<View>` rather than a canvas of their
own. Keep the layout identical to `Default.tsx` so nothing shifts when it loads, and keep its work off the main
thread until after load. `tests/motion.spec.ts` checks for layout shift and the JS budget.

## Launch checklist (PRD 15)

Done in this build:

- [x] All pages, copy from the PRD, mobile first, WCAG 2.2 AA (axe tests on every page at three sizes)
- [x] Forms with validation, honeypot, Turnstile, rate limits and idempotency; data written only by server actions
- [x] RLS on every table, owner actions need two-factor sign-in, audit log, signed URLs for applicant files
- [x] Admin: inquiries, applications and vetting, roles, activities, content, settings, team, activity log, CSV export
- [x] Retention jobs, privacy notice, consent records, delete-a-person
- [x] Metadata, Open Graph images, sitemap, robots, JSON-LD, security headers, cookieless analytics
- [x] Motion tiers and slots, with reduced motion and tier C fallbacks

Before launch:

- [ ] Kennedy's answers in [CONFIRMATIONS.md](./CONFIRMATIONS.md), items 1–5 first
- [ ] Privacy notice reviewed by a lawyer; ODPC registration checked
- [ ] Photo shoot, then `npm run photos` for each
- [ ] Production Turnstile keys, Resend domain, analytics domain, `CRON_SECRET`
- [ ] First owner invited, two-factor set up; a test request and application end to end on production
- [ ] Real-device check on a mid-range Android phone (scroll smoothness, the hero, forms on 3G)

## Performance notes

On the CI machine, Lighthouse's simulated throttling estimates LCP at about 2.7–2.9s for `/` and `/request`. In the
same runs the measured LCP is the hero text, painted together with FCP (about 0.15–0.25s unthrottled). The
estimate rises because the simulation counts the page's low-priority JavaScript, which the text does not wait for.
With real CPU and network throttling (`--throttling-method=devtools`), LCP is about 1.7s. These two LCP checks are
warnings in `lighthouserc.json`, and every other budget fails the build. Use field data (Vercel Speed Insights or
CrUX) to confirm after launch.
