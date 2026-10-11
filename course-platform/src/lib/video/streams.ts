import theProd from "../content/the-prod/streams.json";
import type { VideoStream } from "./hls.ts";

// Which videos have been packaged, per course. streams.json is written by the
// GitHub Action after it encrypts and uploads a video; a code missing from it
// has no protected stream yet. Add a line here for each new course.
// (Not imported by scripts/video/test-server.ts: Node needs an import
// attribute for JSON, which Next doesn't. The pure logic lives in hls.ts.)

export type { Rendition, VideoStream } from "./hls.ts";

// Cast through unknown: the JSON is machine-written, so a small shape change
// shouldn't break the build. isStream checks what the server relies on.
const load = (json: unknown) => json as Record<string, unknown>;

const registry: Record<string, Record<string, unknown>> = {
  "the-prod": load(theProd),
};

function isStream(s: unknown): s is VideoStream {
  if (!s || typeof s !== "object") return false;
  const v = s as Partial<VideoStream>;
  return (
    typeof v.version === "string" &&
    typeof v.duration === "number" &&
    Array.isArray(v.segments) &&
    v.segments.length > 0 &&
    v.segments.every((d) => typeof d === "number" && d > 0) &&
    Array.isArray(v.renditions) &&
    v.renditions.length > 0 &&
    v.renditions.every((r) => r && typeof r.id === "string" && /^[0-9A-Za-z]{1,16}$/.test(r.id) && typeof r.bandwidth === "number")
  );
}

/** The packaged stream for one video, or undefined. */
export function getStream(course: string, code: string): VideoStream | undefined {
  if (!Object.hasOwn(registry, course)) return undefined;
  const streams = registry[course];
  if (!Object.hasOwn(streams, code)) return undefined;
  const s = streams[code];
  return isStream(s) ? s : undefined;
}

/** Video codes with a protected stream in a course. */
export function streamCodes(course: string) {
  if (!Object.hasOwn(registry, course)) return [];
  return Object.keys(registry[course]).filter((code) => isStream(registry[course][code]));
}
