# Confirmations awaiting Kennedy

Every fact below ships with the default shown and a `CONFIRM` comment beside it in code. When Kennedy answers, change
the value where listed (most are also editable in the admin) and tick it off here. Items 1–5 change what schools are
promised: get them before launch.

Find every marker with `grep -rn CONFIRM app components content lib supabase`.

## Questions for Kennedy (PRD section 18)

| #   | Question                                                 | Default shipped                 | Where to change it                                                                         |
| --- | -------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------ |
| 1   | Are demonstrations free for schools?                     | Free                            | `content/pages.ts` (For Schools, step 2). The page doesn't yet say "free"; add it once confirmed |
| 2   | Who pays: the school, or parents through a termly fee?   | The school                      | Copy assumes the school; a parent-paid model needs a parent page                           |
| 3   | Is Homa Bay in the launch counties?                      | Included                        | Admin → Settings → Counties served (drives map, forms, footer, headings); `content/site.ts`; `supabase/seed.sql` |
| 4   | Written permission to name Kenyatta University?          | Named; remove if no             | `content/home.ts` (`founder.body`)                                                         |
| 5   | Which number is on WhatsApp, and how fast can you reply? | 0722 524 438; 2 working days    | Admin → Settings → WhatsApp number, Response time                                          |
| 6   | Age range and group sizes for karate?                    | Primary to university           | Admin → Activities → Kenpo Karate → Age range; `content/pages.ts` (`karatePage.who`); `content/home.ts` ("From Grade 1 to university") |
| 7   | Coach employment terms: full-time, part-time or both?    | Both offered                    | `content/pages.ts` (Join FAQ); `lib/validation/application.ts` (`workPreferences`)          |
| 8   | Is a first aid certificate required to be approved?      | Desirable, not required         | Admin → Settings → Required vetting checks                                                 |
| 9   | Do you run belt gradings for learners?                   | FAQ hidden                      | `content/pages.ts` (`showGradingFaq`, `gradingFaq.a`)                                      |
| 10  | Uniforms and equipment: who provides them?               | Agreed per school               | `content/pages.ts` (karate "what a programme looks like" and FAQs; For Schools FAQ)        |
| 11  | Comfortable with the senior-school "Why now" angle?      | Shown                           | `content/home.ts` (`whyNow`); remove `<WhyNow />` from `app/(site)/page.tsx` if not         |
| 12  | Email address and domain                                 | Hidden until set                | Admin → Settings → Email; Vercel env `RESEND_API_KEY`, `EMAIL_FROM`                         |
| 13  | Logo                                                     | Wordmark                        | `components/site/Wordmark.tsx`, `app/favicon.ico`, `app/opengraph-image.tsx`                |
| 14  | Two or three testimonials with written permission        | Section hidden                  | Admin → Content (shows on Home once two are published)                                     |
| 15  | Social media accounts                                    | Hidden                          | Admin → Settings → Social links                                                            |
| 16  | Punch photo at full resolution, plus the section 9 shoot | Dark placeholders               | `scripts/process-photos.ts`, then `content/media.ts` (`src`, `strikePoint`)                 |

## Copy and facts marked CONFIRM in code

| Item                                                                                       | File                                   |
| ------------------------------------------------------------------------------------------ | -------------------------------------- |
| Hero proof line "Nairobi and 5 more counties" (computed from Settings)                     | `content/home.ts`, `Hero.tsx`          |
| "From Grade 1 to university" age range (Why now)                                           | `content/home.ts`                      |
| Background checks wording (belt stage 4)                                                    | `content/home.ts`                      |
| Kennedy's quote, lightly edited from the discovery form                                    | `content/home.ts`                      |
| "Starting in six counties." (count from Settings)                                          | `content/home.ts`                      |
| Karate: who it's for; each "what a programme looks like" line; each FAQ answer             | `content/pages.ts`                     |
| For Schools FAQ: who the coaches are; age groups; equipment; how soon you can start        | `content/pages.ts`                     |
| Join FAQ: "Is this a full-time role?" (draft answer: both full- and part-time)              | `content/pages.ts`                     |
| Response time "2 working days" on Contact and success screens (from Settings)              | Admin → Settings                       |
| Launching-soon outcomes, drawn from each one-liner; Coding & Robotics has two draft ones   | Admin → Activities; `content/activities.ts` |
| Which disciplines are flagged "recruiting" (all seven by default)                          | Admin → Activities                     |
| Retention periods: declined documents 6 months, records 12; lost/closed requests 24 months | `lib/jobs/retention.ts`, migration, Privacy notice |
| Whether registration with the Office of the Data Protection Commissioner is required       | Lawyer; Privacy notice                 |

## Draft copy written for this build (not in the PRD)

The PRD's copy is used word for word. These few lines had no copy in the PRD and were written to fill a gap. Please
approve or replace them.

| Where                                                | Draft                                                                                                   |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Privacy notice (whole page)                          | Plain-language draft covering every point in PRD 7.8. **Needs legal review before launch.**             |
| Join FAQ answer to "Is this a full-time role?"       | "We offer both full-time and part-time coaching, depending on the programmes in your area."             |
| FAQ section headings                                 | "Frequently asked questions"                                                                            |
| Request page lead lines                              | Reuse PRD lines: "Tell us about your learners. We'll bring the demonstration." / "Register your school's interest and we'll contact you first." |
| Contact form consent                                 | Request-form consent wording, with "this message" instead of "this request"                              |
| Request step 2 heading                               | "Help us prepare", from the PRD's "Help us prepare (optional, 1 minute)"                                  |
| Error pages                                          | "Something went wrong." / "Please try again. If it keeps happening, call or WhatsApp us."               |
| Form validation extras                               | Length messages (e.g. "Please keep your message under 1,500 characters."), "Please enter a valid email address.", "You need to be 18 or older to apply." |
| Admin interface text                                 | Labels, hints and empty states inside the private admin                                                  |
