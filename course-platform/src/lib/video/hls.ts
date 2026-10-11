import { SEGMENT_SECONDS, segmentIv, segmentKey, segmentPath, toHex, variantFor, type SegmentRef } from "./derive.ts";
import type { TokenPayload } from "./token.ts";

// Pure HLS logic for the key server: playlists, the paced key window and the
// decision to release one segment key. No env, no Next, no JSON registry, so
// scripts/video/test-server.ts runs it straight from Node.

/** One quality level, as written to streams.json by the packager. */
export type Rendition = {
  id: string; // "1080", "720", "480"
  width: number;
  height: number;
  bandwidth: number; // peak bits/s
  averageBandwidth?: number;
  codecs?: string; // "avc1.640028,mp4a.40.2"
};

/** One video's entry in src/lib/content/<course>/streams.json. */
export type VideoStream = {
  version: string; // first 8 hex of the source file's sha256
  duration: number; // seconds
  segments: number[]; // EXTINF durations, the same for every rendition and variant
  renditions: Rendition[];
  source?: string;
  packagedAt?: string;
};

/** Paced key release. A token unlocks BACK segments behind its start, AHEAD in
 *  front, and the window grows at PACE x real time. Ripping is then no faster
 *  than watching at 2.5x; a seek outside it needs a new session. */
export const KEY_WINDOW = { ahead: 6, back: 2, pace: 2.5 };

export type KeyWindow = typeof KEY_WINDOW;

/** Segment index for a start time in seconds, clamped to the video. */
export function segmentAt(stream: VideoStream, seconds: number) {
  const last = Math.max(0, stream.segments.length - 1);
  if (!Number.isFinite(seconds) || seconds <= 0) return 0;
  let t = 0;
  for (let i = 0; i < stream.segments.length; i++) {
    t += stream.segments[i];
    if (seconds < t) return i;
  }
  return last;
}

/** Segment indexes a token may fetch keys for, `elapsedMs` after it was issued. */
export function keyWindow(from: number, elapsedMs: number, w: KeyWindow = KEY_WINDOW) {
  const elapsed = Math.max(0, elapsedMs) / 1000;
  return {
    min: Math.max(0, from - w.back),
    max: from + w.ahead + Math.floor((elapsed / SEGMENT_SECONDS) * w.pace),
  };
}

export function inKeyWindow(index: number, from: number, elapsedMs: number, w: KeyWindow = KEY_WINDOW) {
  const { min, max } = keyWindow(from, elapsedMs, w);
  return index >= min && index <= max;
}

/** Bits per second, rounded for the playlist. */
const bps = (n: number) => Math.max(1, Math.round(n));

/** Master playlist: one variant stream per rendition, each carrying the token. */
export function masterPlaylist(stream: VideoStream, token: string) {
  const lines = ["#EXTM3U", "#EXT-X-VERSION:3"];
  for (const r of stream.renditions) {
    const attrs = [`BANDWIDTH=${bps(r.bandwidth)}`];
    if (r.averageBandwidth) attrs.push(`AVERAGE-BANDWIDTH=${bps(r.averageBandwidth)}`);
    attrs.push(`RESOLUTION=${r.width}x${r.height}`);
    if (r.codecs) attrs.push(`CODECS="${r.codecs}"`);
    lines.push(`#EXT-X-STREAM-INF:${attrs.join(",")}`, `${r.id}.m3u8?t=${token}`);
  }
  return lines.join("\n") + "\n";
}

export type MediaPlaylistInput = {
  secret: string;
  cdnUrl: string; // no trailing slash
  course: string;
  code: string;
  stream: VideoStream;
  rendition: string;
  watermarkId: number;
  token: string;
};

/** VOD media playlist for one student. Every segment gets its own key line
 *  (relative URI, resolved against the playlist URL to
 *  /api/video/<course>/<code>/key/<rendition>/<i>) and the CDN URL of the
 *  variant (a or b) this student's watermark id picks. */
export async function mediaPlaylist(p: MediaPlaylistInput) {
  // TARGETDURATION >= every EXTINF rounded to the nearest second (RFC 8216).
  const target = p.stream.segments.reduce((m, d) => Math.max(m, Math.round(d)), 1);
  const lines = [
    "#EXTM3U",
    "#EXT-X-VERSION:3",
    `#EXT-X-TARGETDURATION:${target}`,
    "#EXT-X-MEDIA-SEQUENCE:0",
    "#EXT-X-PLAYLIST-TYPE:VOD",
  ];
  const refs = p.stream.segments.map(
    (_, index): SegmentRef => ({
      course: p.course,
      code: p.code,
      version: p.stream.version,
      rendition: p.rendition,
      variant: variantFor(p.watermarkId, index),
      index,
    }),
  );
  const [ivs, paths] = await Promise.all([
    Promise.all(refs.map((r) => segmentIv(p.secret, r))),
    Promise.all(refs.map((r) => segmentPath(p.secret, r))),
  ]);
  p.stream.segments.forEach((duration, i) => {
    lines.push(
      `#EXT-X-KEY:METHOD=AES-128,URI="key/${p.rendition}/${i}?t=${p.token}",IV=0x${toHex(ivs[i])}`,
      `#EXTINF:${duration.toFixed(3)},`,
      `${p.cdnUrl}/${paths[i]}`,
    );
  });
  lines.push("#EXT-X-ENDLIST");
  return lines.join("\n") + "\n";
}

export type KeyResult =
  | { status: 200; key: Uint8Array }
  | { status: 404; error: string }
  | { status: 410; error: string }
  | { status: 429; error: string };

/** Decide whether a verified token may have the key for one segment, and
 *  derive it for the token's own variant. The caller has already checked the
 *  token's signature, expiry and course/code. */
export async function releaseKey(
  secret: string,
  token: TokenPayload,
  stream: VideoStream,
  rendition: string,
  index: number,
  now = Date.now(),
  w: KeyWindow = KEY_WINDOW,
): Promise<KeyResult> {
  if (token.ver !== stream.version) return { status: 410, error: "video updated" };
  if (!stream.renditions.some((r) => r.id === rendition)) return { status: 404, error: "unknown rendition" };
  if (!Number.isInteger(index) || index < 0 || index >= stream.segments.length) {
    return { status: 404, error: "unknown segment" };
  }
  if (!inKeyWindow(index, token.f, now - token.iat, w)) return { status: 429, error: "outside window" };
  const key = await segmentKey(secret, {
    course: token.c,
    code: token.k,
    version: stream.version,
    rendition,
    variant: variantFor(token.w, index),
    index,
  });
  return { status: 200, key };
}
