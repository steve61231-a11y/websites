import { connection } from "next/server";
import { canWatch, getViewer } from "@/lib/video/access";
import { videoConfig } from "@/lib/video/config";
import { MAX_WATERMARK_ID, SEGMENT_SECONDS } from "@/lib/video/derive";
import { KEY_WINDOW, segmentAt } from "@/lib/video/hls";
import { allowSession } from "@/lib/video/rate-limit";
import { getStream } from "@/lib/video/streams";
import { newSessionId, signToken, TOKEN_TTL_MS } from "@/lib/video/token";
import { crossSite, json, validCode, validCourse } from "../_shared";

// POST /api/video/session {course, code, from?, demo?}
// Starts a playback session: checks the viewer may watch, then returns a
// signed, short-lived playlist URL for them. Called again after a seek
// outside the paced window, a 429/410 from the key server, or expiry.

export async function POST(request: Request) {
  await connection(); // per request, never prerendered or cached
  if (crossSite(request)) return json(403, { error: "cross-site" });

  if (Number(request.headers.get("content-length") ?? 0) > 4096) return json(413, { error: "too large" });
  const raw = await request.text();
  if (raw.length > 4096) return json(413, { error: "too large" });
  let body: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") throw new Error();
    body = parsed as Record<string, unknown>;
  } catch {
    return json(400, { error: "bad json" });
  }
  const { course, code } = body;
  if (!validCourse(course) || !validCode(code)) return json(400, { error: "bad course or code" });
  const video = { course, code };

  const demo = body.demo && typeof body.demo === "object" ? (body.demo as { name?: unknown; email?: unknown }) : undefined;
  const viewer = await getViewer(request, video, demo);
  if (!viewer) return json(401, { error: "sign in to watch" });
  if (!Number.isInteger(viewer.watermarkId) || viewer.watermarkId < 1 || viewer.watermarkId > MAX_WATERMARK_ID) {
    console.error(`[video] viewer ${viewer.userId} has no valid watermark id`);
    return json(500, { error: "account not ready for video" });
  }
  if (!(await canWatch(viewer, video))) return json(403, { error: "locked" });

  const stream = getStream(course, code);
  if (!stream) return json(404, { error: "no stream" });
  const config = videoConfig();
  if (!config) return json(503, { error: "video not configured" });

  if (!allowSession(viewer.userId, course, code)) return json(429, { error: "too many sessions, try again in a few minutes" });
  // Phase 2: also insert a video_sessions row (user, course, code, ip, user agent).

  const from = segmentAt(stream, typeof body.from === "number" ? body.from : 0);
  const issuedAt = Date.now();
  const expiresAt = issuedAt + TOKEN_TTL_MS;
  const token = await signToken(config.secret, {
    v: 1,
    sub: viewer.userId,
    w: viewer.watermarkId,
    c: course,
    k: code,
    ver: stream.version,
    f: from,
    iat: issuedAt,
    exp: expiresAt,
    sid: newSessionId(),
  });

  return json(200, {
    src: `/api/video/${encodeURIComponent(course)}/${encodeURIComponent(code)}/master.m3u8?t=${token}`,
    duration: stream.duration,
    segmentSeconds: SEGMENT_SECONDS,
    from,
    window: KEY_WINDOW,
    issuedAt,
    expiresAt,
    label: viewer.label,
  });
}
