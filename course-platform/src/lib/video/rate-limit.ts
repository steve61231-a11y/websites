// How often a student may start a playback session (POST /api/video/session).
// Each seek outside the paced key window needs a new session, so this caps
// how fast anyone can walk through a video by seeking.
//
// In-memory sliding window: per server instance, reset on restart. Good enough
// for one server. Phase 2: count rows in the video_sessions table instead
// (supabase/migrations/0002_video.sql), so the limit holds across instances.

export const SESSION_LIMITS = [
  { scope: "user", max: 60, windowMs: 60 * 60 * 1000 }, // 60 per student per hour
  { scope: "video", max: 30, windowMs: 10 * 60 * 1000 }, // 30 per student per video per 10 minutes
] as const;

const hits = new Map<string, number[]>();
const MAX_KEYS = 50_000;

function recent(key: string, windowMs: number, now: number) {
  const list = (hits.get(key) ?? []).filter((t) => t > now - windowMs);
  if (list.length) hits.set(key, list);
  else hits.delete(key);
  return list;
}

/** Drop stale entries so the map can't grow without bound. */
function prune(now: number) {
  const longest = Math.max(...SESSION_LIMITS.map((l) => l.windowMs));
  for (const key of hits.keys()) recent(key, longest, now);
  // Still too many: forget the oldest keys first (a Map keeps insertion order).
  for (const key of hits.keys()) {
    if (hits.size <= MAX_KEYS) break;
    hits.delete(key);
  }
}

/** Record a session start if it is within every limit. Returns false (and
 *  records nothing) when the student should wait. */
export function allowSession(userId: string, course: string, code: string, now = Date.now()) {
  const keys = SESSION_LIMITS.map((l) => (l.scope === "user" ? `u|${userId}` : `v|${userId}|${course}|${code}`));
  const lists = SESSION_LIMITS.map((l, i) => recent(keys[i], l.windowMs, now));
  if (lists.some((list, i) => list.length >= SESSION_LIMITS[i].max)) return false;
  if (hits.size > MAX_KEYS) prune(now);
  keys.forEach((key, i) => hits.set(key, [...lists[i], now]));
  return true;
}

/** For tests. */
export function resetRateLimits() {
  hits.clear();
}
