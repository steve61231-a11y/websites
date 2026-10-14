import "server-only";
import { timingSafeEqual } from "node:crypto";

/** Scheduled job routes are protected by CRON_SECRET (Vercel Cron sends it as a bearer token). */
export function isCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const got = Buffer.from(request.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  return got.length === want.length && timingSafeEqual(got, want);
}
