import { backendConfigured } from "@/lib/server/env";
import { userFromRequest } from "@/lib/server/store";

// Helpers shared by the /api routes (not a route itself).

export const NO_STORE = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };

export function json(status: number, body: unknown) {
  return Response.json(body, { status, headers: NO_STORE });
}

/** Browsers fetching from another site's page are refused; same-site and non-browser callers pass. */
export function crossSite(request: Request) {
  return request.headers.get("sec-fetch-site") === "cross-site";
}

/** Reads a small JSON body, or null if it's missing, too big or not an object. */
export async function readJson(request: Request, maxBytes = 8192): Promise<Record<string, unknown> | null> {
  const raw = await request.text();
  if (raw.length > maxBytes) return null;
  try {
    const v: unknown = JSON.parse(raw);
    return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export const notConfigured = () => json(503, { error: "The backend isn't configured on this deployment yet." });

/** The signed-in student, or a ready-made refusal. */
export async function requireUser(request: Request) {
  if (!backendConfigured()) return { response: notConfigured() };
  const user = await userFromRequest(request);
  return user ? { user } : { response: json(401, { error: "Sign in to continue." }) };
}

export const str = (v: unknown, max: number) => (typeof v === "string" && v.trim().length > 0 && v.length <= max ? v.trim() : null);
export const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && v.length <= 120;
