import "server-only";

/**
 * Cloudflare Turnstile verification (PRD 13). Until keys are configured the
 * check is skipped (honeypot and rate limits still apply); set
 * TURNSTILE_SECRET_KEY in every deployed environment. Cloudflare's test keys
 * work for previews.
 */
export async function verifyTurnstile(token: string | undefined, ip: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    if (process.env.VERCEL_ENV === "production") console.warn("TURNSTILE_SECRET_KEY is not set in production");
    return true;
  }
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (ip) body.set("remoteip", ip);
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (error) {
    console.error("Turnstile verification failed", error);
    return false;
  }
}
