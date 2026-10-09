# Backend and security plan

What's left to take THE PROD from clickable prototype to a live, paid platform, and how the videos are protected. The front end is done. Everything below happens on the server, so the browser is never trusted with money, answers, unlocks or video files.

## The stack

| Job | Service | Why |
|---|---|---|
| Website and server code | Next.js on Vercel | What it's built in. Server actions and route handlers hold all the secrets. |
| Database, sign-in, file storage | Supabase (Postgres) | The schema is written (`supabase/migrations/0001_initial_schema.sql`), with row-level security on every table. Sign-in uses an email code or Google. |
| Payments | Paystack | M-Pesa and card in KES. |
| Video | A DRM video host: **VdoCipher**, or **Bunny Stream with MediaCage DRM** | Encrypted streaming, a watermark per viewer, and screen-capture blocking where the device supports it. See below. |
| Email | Resend (or Postmark) | Receipt, access link, certificate. The templates are already written: `src/lib/receipt.ts`, `src/lib/certificate-email.ts`. |

## How each flow works on the server

**1. Paying**
1. The student taps Pay. A server action creates a Paystack transaction, using the price from the database, never the price shown in the browser.
2. The student pays with an M-Pesa prompt or a card.
3. Paystack calls our webhook. We check the request's signature with the Paystack secret key, confirm the transaction with Paystack's API, and record it only once per transaction reference.
4. In one database transaction we write `payments`, `enrollments` and the receipt.
5. We send the receipt email and the access email (a one-time sign-in link or code).

The on-screen receipt printer shows the same receipt.

**2. Signing in**
- The student signs in with the email they paid with, using a Supabase one-time code or Google. Access depends on an `enrollments` row, never on the login alone (the demo already behaves this way).

**3. Watching a lesson**
1. The server checks the student is enrolled and that the day is unlocked. The unlock rules in `src/lib/progress.ts` run on the server.
2. It then asks the video host for a playback token. The token lasts a few minutes, works only for this student and this video, and only on our domain.
3. The player loads the encrypted stream with that token and overlays the student's name and email as a moving watermark.
4. Progress is saved to `lesson_progress`.

**4. Quizzes**
- The questions reach the browser without the answers. A server function grades each attempt, stores it in `quiz_attempts`, and decides what unlocks.

**5. Certificate**
1. When the final assessment is passed, a server function re-checks every lesson and quiz, then issues the certificate number from a database sequence. The number is unique and can't be guessed.
2. It renders the certificate from the course's template (`course.certificate`: the template image plus the name, date and number positions, the same config the browser uses). The render uses `@napi-rs/canvas` or `satori` + `resvg`, and outputs a PNG and a PDF (`pdf-lib`).
3. It stores the files in Supabase Storage.
4. It emails the PDF to the student.

The public page `/certificate/<id>` lets anyone verify it.

## Video protection: what is and isn't possible

Here is the honest version for the client.

**What we can do (all of it together):**
1. **DRM encryption (Widevine, FairPlay, PlayReady).** The video is never a downloadable file. Download tools and "save video" get nothing usable, and stolen links stop working within minutes.
2. **Screen-capture blocking where the hardware supports it.** With hardware-backed DRM, screen recordings and screenshots come out black:
   - Safari on Mac, iPhone and iPad.
   - Most Android phones (Widevine L1).
   - Edge on Windows with hardware DRM.

   VdoCipher and Bunny MediaCage both offer this.
3. **A watermark per student.** Their name, email or phone moves around the video. If a recording leaks, it shows exactly who leaked it. This is the strongest deterrent, and it already exists in the prototype's player.
4. **Signed, short-lived playback tokens.** Each token is tied to one student and only plays on our domain.
5. **Device and session limits.** For example, 2 devices per student. Too many plays or simultaneous streams get flagged.
6. **Terms of use and takedowns.** Students accept the terms at checkout. Leaked copies are traced through the watermark and taken down.

**What no platform can guarantee:**
- On **desktop Chrome and Firefox**, DRM runs in software, and the browser can't reliably stop a screen recorder. Every course platform lives with this. There, the watermark does the protecting.
- **Someone filming the screen with another phone** can't be stopped by any technology. The watermark makes it traceable.

Bottom line: we can make piracy hard, traceable and not worth it, but no one can honestly promise "impossible". Anyone who does is overselling.

## Security checklist

- Secret keys (Paystack, Supabase service role, video host, email) live only in server environment variables, never in browser code.
- Row-level security on every table (done in the schema). The service role is used only inside server functions.
- Paystack webhook: verify the signature, re-check the transaction with the API, and process each reference only once.
- Answers and unlock rules stay on the server. Prices come from the database.
- Rate limits on sign-in codes, quiz attempts and the webhook.
- Security headers: Content-Security-Policy, HSTS, frame-ancestors; cookies set to httpOnly, secure and sameSite.
- Logs for payments, enrollments and certificate issuing. Daily database backups.
- Kenya Data Protection Act: register with the Office of the Data Protection Commissioner if required, publish a privacy policy, and collect only what's needed.
- Keep dependencies up to date and run `npm audit` in CI.

## Build order

1. Supabase project: run the migration, seed the course, and switch the demo store over to Supabase queries. Turn on sign-in.
2. Paystack: test mode, checkout, webhook, receipt and access emails, then live mode.
3. Video host: upload, DRM, playback tokens, watermark. Then put the links in `media.ts` (they become per-student tokens at this step).
4. Server grading and unlocks, progress saving.
5. Certificate issuing: render, storage, email.
6. Security pass, a load test, then launch on the real domain.

## Needed from the client

- A Paystack business account (verified) and a Supabase project (we can create it).
- A choice of video host and an account. Then upload the 32 videos.
- The domain, and access to its DNS for the email sender records.
- The certificate template (see the `update-certificate` skill), the final price, the WhatsApp number and the booking link.
