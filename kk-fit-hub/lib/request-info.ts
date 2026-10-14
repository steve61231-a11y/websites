import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";

/** The visitor's IP from proxy headers (Vercel sets x-forwarded-for). */
export async function clientIp(): Promise<string | null> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || null;
  return h.get("x-real-ip");
}

/** Rate-limit keys never store raw IPs or phone numbers. */
export function hashKey(kind: string, value: string): string {
  const salt = process.env.RATE_LIMIT_SALT ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? "kk";
  return `${kind}:${createHash("sha256").update(`${salt}:${value}`).digest("hex").slice(0, 32)}`;
}
