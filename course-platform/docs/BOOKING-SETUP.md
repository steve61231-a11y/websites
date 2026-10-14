# 1:1 session booking

Students pick a topic, enter their details and pay (M-Pesa or card). As soon as the payment is confirmed, Duncan's **Cal.com** calendar pops up on the same page with their name and email already filled in. They choose a day and time, and it lands on his Google Calendar with a Google Meet link. Cal.com sends the confirmation, reminders and reschedule/cancel links. No subscription: Cal.com's free plan is enough, and payment stays on our own checkout (Cal.com can't take M-Pesa).

## What Duncan does (about 15 minutes, once)
1. Go to **cal.com** and sign up for free with **Continue with Google**, using the Google account his calendar is on.
2. When it asks, **connect Google Calendar** and click Allow. Tick the calendars to check for busy times (anything on them blocks those times).
3. **Availability:** set the days and hours he's open for sessions, in Nairobi time.
4. **Create one event** called "1:1 session", with the length he wants. Under **Location**, choose **Google Meet**.
5. **Booking questions** (event → Advanced): add the questions he wants answered by people who book, for example "What do you want to work on?" and "Tell me about your business".
6. Copy the event's link (it looks like `cal.com/duncan/session`) and send it to whoever runs the site.

Keep it as **one** event rather than three: the student's topic is passed in the notes box automatically. (Cal.com's free plan may limit the number of events, and one is all we need.)

## What goes on the site
- The link goes in `brand.session.calUrl` in `src/lib/catalog.ts`. Until it's set, a preview calendar is shown so the whole journey can be walked through.
- Price, length and the three topics are in the same place (`brand.session`).

## How it fits together
`/book` (or a "How we help" card) → topic → details → pay → receipt prints → the calendar pops up (`src/components/book/cal-modal.tsx`, address built in `src/lib/booking/cal.ts`). The receipt email also carries the link, in case someone pays and closes the page before choosing a time.

## Stopping people booking without paying (Phase 2)
The Cal.com link is public if someone finds it. With the payment step (Paystack webhook) we close that gap: after each verified payment the server asks Cal.com for a **single-use private link** (hash-based, stops working after one booking) and shows that instead. This needs a Cal.com API key (`CAL_API_KEY`) and has to be confirmed against the free plan when it's built. A backstop: Cal.com can tell our server about every new booking, so any booking without a matching payment can be flagged and cancelled.

## Backup: our own booking screens
`brand.session.provider = "own"` switches to our built-in picker, which reads Duncan's Google Calendar directly (`GOOGLE_*` settings in `.env.example`, `src/lib/booking/`) and holds a slot for 10 minutes while the student pays (`supabase/migrations/0003_bookings.sql`). It needs a one-time Google developer setup, which is why Cal.com is the default.

## Status
- Built and tested: topic → details → pay → receipt → calendar pop-up, on phone and desktop; the Cal.com address builder; the built-in slot maths.
- Not yet tested against the real Cal.com page: it needs Duncan's link. Check that the pop-up loads, the name and email are filled in and a test booking reaches his Google Calendar.
