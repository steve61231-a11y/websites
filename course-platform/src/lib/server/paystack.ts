import { createHmac, timingSafeEqual } from "node:crypto";

// Paystack: start a payment, check one, and verify webhook calls.
// Amounts are in the smallest unit (KES x 100). Docs: paystack.com/docs/api

type Fetch = typeof fetch;
const API = "https://api.paystack.co";

/** Is this webhook really from Paystack? HMAC-SHA512 of the raw body with our secret key. */
export function verifySignature(rawBody: string, header: string | null, secret: string) {
  if (!header || !secret) return false;
  const mac = Buffer.from(createHmac("sha512", secret).update(rawBody).digest("hex"));
  const got = Buffer.from(header.trim().toLowerCase());
  return mac.length === got.length && timingSafeEqual(mac, got);
}

export const toSubunits = (kes: number) => Math.round(kes * 100);

async function call<T>(secret: string, path: string, init: RequestInit, fetchFn: Fetch): Promise<T> {
  const res = await fetchFn(`${API}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json", ...init.headers },
  });
  const body = (await res.json().catch(() => ({}))) as { status?: boolean; message?: string; data?: T };
  if (!res.ok || body.status === false || !body.data) throw new Error(`Paystack ${path}: ${body.message ?? res.status}`);
  return body.data;
}

export type Initialized = { authorizationUrl: string; accessCode: string; reference: string };

export async function initializeTransaction(
  secret: string,
  p: { email: string; amountKes: number; currency: string; reference: string; callbackUrl: string; metadata: Record<string, unknown> },
  fetchFn: Fetch = fetch,
): Promise<Initialized> {
  const d = await call<{ authorization_url: string; access_code: string; reference: string }>(
    secret,
    "/transaction/initialize",
    {
      method: "POST",
      body: JSON.stringify({
        email: p.email,
        amount: toSubunits(p.amountKes),
        currency: p.currency,
        reference: p.reference,
        callback_url: p.callbackUrl,
        channels: ["mobile_money", "card"],
        metadata: p.metadata,
      }),
    },
    fetchFn,
  );
  return { authorizationUrl: d.authorization_url, accessCode: d.access_code, reference: d.reference };
}

export type Verified = {
  status: string; // "success" | "failed" | "abandoned" | "pending" | ...
  reference: string;
  id: string;
  amount: number; // subunits
  currency: string;
  channel: string;
  paidAt: string | null;
};

export async function verifyTransaction(secret: string, reference: string, fetchFn: Fetch = fetch): Promise<Verified> {
  const d = await call<{ status: string; reference: string; id: number | string; amount: number; currency: string; channel: string; paid_at: string | null }>(
    secret,
    `/transaction/verify/${encodeURIComponent(reference)}`,
    { method: "GET" },
    fetchFn,
  );
  return { status: d.status, reference: d.reference, id: String(d.id), amount: d.amount, currency: d.currency, channel: d.channel, paidAt: d.paid_at };
}
