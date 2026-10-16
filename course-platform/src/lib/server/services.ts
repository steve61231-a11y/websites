import { env } from "./env.ts";
import { sendEmail } from "./email.ts";
import { verifyTransaction } from "./paystack.ts";
import type { Deps } from "./settle.ts";
import { supabaseStore } from "./store.ts";

/** The real database, Paystack and Resend, wired up for the routes. */
export function liveDeps(): Deps {
  const secret = env.paystackSecret();
  return {
    store: supabaseStore(),
    verify: (reference) => verifyTransaction(secret, reference),
    mail: sendEmail,
    siteUrl: env.siteUrl(),
    notify: env.notifyEmail() || undefined,
  };
}
