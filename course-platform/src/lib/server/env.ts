// Server settings, read from the environment when needed (so tests can set them).
// Never import this from a client component.

const get = (k: string) => (process.env[k] ?? "").trim();

export const env = {
  supabaseUrl: () => get("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseServiceKey: () => get("SUPABASE_SERVICE_ROLE_KEY"),
  paystackSecret: () => get("PAYSTACK_SECRET_KEY"),
  resendKey: () => get("RESEND_API_KEY"),
  /** "THE PROD <hello@yourdomain.com>": must be a domain verified in Resend. */
  mailFrom: () => get("MAIL_FROM") || "THE PROD <onboarding@resend.dev>",
  mailReplyTo: () => get("MAIL_REPLY_TO"),
  /** Gets a short note for every purchase and booking. */
  notifyEmail: () => get("NOTIFY_EMAIL"),
  /** The public address of the site, no trailing slash. */
  siteUrl: () => (get("SITE_URL") || "http://localhost:3000").replace(/\/+$/, ""),
  calWebhookSecret: () => get("CAL_WEBHOOK_SECRET"),
};

/** Is the real backend (database, payments) switched on for this deployment? */
export function backendConfigured() {
  return !!(env.supabaseUrl() && env.supabaseServiceKey());
}
