# Going live: what to paste where

The code is finished. These are the only steps left, in order. Test with Paystack **test** keys first, then swap in the live ones.

## 1. Supabase (database and sign-in), project `ozsvyxsrtgwnimhbrbss`
The tables and security rules are already created.
1. **Project Settings → API**: copy the Project URL, the `anon`/publishable key and the `service_role` key.
2. **Authentication → Providers → Email**: on. Turn **off** "Confirm email" links if offered; students sign in with a 6-digit code.
3. **Authentication → Emails → Templates → Magic Link** (and **Confirm signup**): use `Your THE PROD code is {{ .Token }}`.
4. **Authentication → SMTP Settings**: use Resend (host `smtp.resend.com`, port 465, user `resend`, password = Resend API key, sender = your `MAIL_FROM`). Without this Supabase only sends a few emails an hour.
5. **Authentication → URL Configuration**: Site URL = your site address.
6. Optional Google button: **Providers → Google**, then set `NEXT_PUBLIC_GOOGLE_AUTH=1`.

## 2. Paystack
1. **Settings → API Keys**: copy the secret key into `PAYSTACK_SECRET_KEY`.
2. **Settings → API Keys & Webhooks → Webhook URL**: `https://YOUR-DOMAIN/api/paystack/webhook`
3. Test with a test key and a test card; then the live key.
4. M-Pesa must be switched on in the Paystack account (Settings → Preferences → Channels).

## 3. Resend (emails)
1. Add your domain; paste the DNS records Resend shows at your domain provider.
2. Create an API key → `RESEND_API_KEY`. Set `MAIL_FROM` to an address on that domain.

## 4. Hosting and domain
Host the `course-platform` folder on Vercel (Next.js 16 works there out of the box) or Cloudflare. Add every variable from `.env.example` in the host's Environment Variables, set `SITE_URL` to the final address, then point the domain at the host (it shows the DNS records). Redeploy.

## 5. Cal.com
Put the event link in `brand.session.calUrl` (`src/lib/catalog.ts`). See `docs/BOOKING-SETUP.md`.

## 6. Videos
See `docs/VIDEO-SETUP.md`.

## Check it works
Buy the course with a test card → receipt prints → you get the receipt and access emails → sign in with the code → watch a lesson → finish a quiz → certificate emails.
