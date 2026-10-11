import { videoConfig, type VideoConfig } from "@/lib/video/config";
import { getStream, type VideoStream } from "@/lib/video/streams";
import { verifyToken, type TokenPayload } from "@/lib/video/token";

// Helpers shared by the /api/video route handlers (not a route itself).

/** Sent on every video response: nothing here may be cached or sniffed. */
export const NO_STORE = {
  "Cache-Control": "private, no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};

export function json(status: number, body: unknown) {
  return Response.json(body, { status, headers: NO_STORE });
}

export function playlist(text: string) {
  return new Response(text, {
    headers: { ...NO_STORE, "Content-Type": "application/vnd.apple.mpegurl" },
  });
}

/** A browser fetching from another site's page. Same-origin and same-site
 *  pass; tools that send no Sec-Fetch-Site header are left to the token. */
export function crossSite(request: Request) {
  return request.headers.get("sec-fetch-site") === "cross-site";
}

const COURSE = /^[a-z0-9-]{1,64}$/;
const CODE = /^[0-9A-Za-z][0-9A-Za-z._-]{0,31}$/;
const RENDITION = /^[0-9A-Za-z]{1,16}$/;

export const validCourse = (s: unknown): s is string => typeof s === "string" && COURSE.test(s);
export const validCode = (s: unknown): s is string => typeof s === "string" && CODE.test(s);
export const validRendition = (s: unknown): s is string => typeof s === "string" && RENDITION.test(s);

export type Playback = { config: VideoConfig; token: string; payload: TokenPayload; stream: VideoStream };

/** Everything a playlist or key request needs: config, a valid token for
 *  this exact video and its current stream. Otherwise the error response. */
export async function playback(request: Request, url: URL, course: string, code: string): Promise<Playback | Response> {
  if (crossSite(request)) return json(403, { error: "cross-site" });
  if (!validCourse(course) || !validCode(code)) return json(404, { error: "not found" });
  const config = videoConfig();
  if (!config) return json(503, { error: "video not configured" });
  const token = url.searchParams.get("t") ?? "";
  const check = await verifyToken(config.secret, token);
  if (!check.ok) {
    return json(401, check.reason === "expired" ? { error: "expired", retry: "session" } : { error: "bad token" });
  }
  const payload = check.payload;
  if (payload.c !== course || payload.k !== code) return json(403, { error: "wrong video" });
  const stream = getStream(course, code);
  if (!stream) return json(404, { error: "no stream" });
  if (payload.ver !== stream.version) return json(410, { error: "video updated", retry: "session" });
  return { config, token, payload, stream };
}
