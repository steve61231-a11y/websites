import { env } from "./env.ts";

// Sends email through Resend (resend.com). The domain in MAIL_FROM must be
// verified there. With no RESEND_API_KEY, mail is logged instead of sent, so
// the rest of the backend still works while it's being set up.

type Fetch = typeof fetch;
export type Mail = { to: string; subject: string; html: string; text: string };

export async function sendEmail(m: Mail, fetchFn: Fetch = fetch): Promise<{ sent: boolean }> {
  const key = env.resendKey();
  if (!key) {
    console.warn(`[email] RESEND_API_KEY not set: not sent "${m.subject}" to ${m.to}`);
    return { sent: false };
  }
  const replyTo = env.mailReplyTo();
  const res = await fetchFn("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.mailFrom(), to: [m.to], subject: m.subject, html: m.html, text: m.text, ...(replyTo ? { reply_to: replyTo } : {}) }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text().catch(() => "")).slice(0, 200)}`);
  return { sent: true };
}
