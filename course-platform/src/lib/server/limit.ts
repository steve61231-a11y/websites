// A small in-memory rate limiter (per server instance). Good enough to blunt
// scripts on a single server; if the site ever runs on many, move the counts
// into the database.

const hits = new Map<string, number[]>();

/** true = allowed. `max` calls per `windowMs` for this key. */
export function allow(key: string, max: number, windowMs: number, now = Date.now()) {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < windowMs)) hits.delete(k);
  return true;
}

export function clientIp(request: Request) {
  return (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || request.headers.get("cf-connecting-ip") || "unknown";
}
