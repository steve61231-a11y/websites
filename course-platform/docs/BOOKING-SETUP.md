# 1:1 session booking

Students pick a topic, a day and a time, pay (M-Pesa or card), and the session lands on Duncan's Google Calendar with a Google Meet link. Google emails the student the invite. No subscription: it's built into the site and uses Google Calendar's free API.

## What a student sees
1. **Topic**: Creative Business Blueprint, Attract More Customers, or Know What Gear To Invest In. The "How we help" cards link straight to the right one.
2. **Day and time**: only times Duncan is free. Times are in Nairobi time.
3. **Details**: name, email, WhatsApp number, and what they want to cover.
4. **Pay**, then the receipt prints and a "You're booked" card appears with an "Add to my calendar" button.

## What Duncan sees
A normal event on his Google Calendar: "Topic: Student name", with a Meet link, the student's email, WhatsApp number, payment reference and what they want to cover. Anything already on his calendar (meetings, personal events) automatically removes those times from what students can book. To block a time off, just put an event there.

## One-time Google setup (about 10 minutes, with Duncan's Google account)
1. Go to **console.cloud.google.com**, create a project called "THE PROD", then **APIs & Services → Library → Google Calendar API → Enable**.
2. **APIs & Services → OAuth consent screen**: User type **External**, fill in the app name and your email. Add Duncan's Gmail as a **test user**. Then click **Publish app** (so the key doesn't expire after 7 days; Google may show an "unverified" notice, which is fine for your own use).
3. **Credentials → Create credentials → OAuth client ID → Web application**. Under **Authorized redirect URIs** add `https://developers.google.com/oauthplayground`. Copy the **Client ID** and **Client secret**.
4. Open **developers.google.com/oauthplayground**. Click the gear icon, tick **Use your own OAuth credentials**, paste the Client ID and secret.
5. In Step 1, paste these two scopes in the box and click **Authorize APIs**, signing in as Duncan:
   `https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.freebusy`
6. In Step 2, click **Exchange authorization code for tokens**. Copy the **Refresh token**.
7. In the hosting settings (Vercel or Cloudflare), add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and `GOOGLE_REFRESH_TOKEN`. Leave `GOOGLE_CALENDAR_ID` empty to use his main calendar.

## Settings you can change (`brand.session` in `src/lib/catalog.ts`)
Price, length, the three topics, working hours per weekday (currently Mon–Fri 9–5 and Sat 10–2, to confirm with Duncan), how much notice a booking needs (24 hours) and how many days ahead students can book (21).

## Status
- Built and tested: the slot maths (`scripts/booking/test-slots.ts`), the booking screens and the calendar file.
- Built, not yet run against a real calendar: the Google connection (`src/lib/booking/google.ts`). It needs the setup above.
- Phase 2 (with the Paystack webhook): after a payment is verified, the server calls `confirmBooking()` to re-check the time is still free and create the calendar event. A time is held for 10 minutes while the student pays (`supabase/migrations/0003_bookings.sql`) so two people can't book the same slot. Until then, `/api/booking/create` is a closed test route (`BOOKING_DEV_OPEN`).

## Why not Cal.com or Calendly
Both have free plans and Google Calendar sync, but their payments work through Stripe or PayPal, not M-Pesa or Paystack, and the booking would live on their site instead of ours. Building it in keeps one checkout, one receipt and one look.
