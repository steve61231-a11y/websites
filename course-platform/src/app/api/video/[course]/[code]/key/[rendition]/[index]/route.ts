import { connection, type NextRequest } from "next/server";
import { releaseKey } from "@/lib/video/hls";
import { json, NO_STORE, playback, validRendition } from "../../../../../_shared";

// GET /api/video/<course>/<code>/key/<rendition>/<i>?t=
// The 16-byte AES key for segment i, for the token's own a/b variant only,
// and only inside the paced window (429 {"retry":"session"} outside it).

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ course: string; code: string; rendition: string; index: string }> },
) {
  await connection(); // per request, never prerendered or cached
  const { course, code, rendition, index } = await params;
  const p = await playback(request, request.nextUrl, course, code);
  if (p instanceof Response) return p;
  if (!validRendition(rendition) || !/^\d{1,6}$/.test(index)) return json(404, { error: "not found" });

  const result = await releaseKey(p.config.secret, p.payload, p.stream, rendition, Number(index));
  if (result.status === 429) return json(429, { retry: "session" });
  if (result.status === 410) return json(410, { error: result.error, retry: "session" });
  if (result.status !== 200) return json(result.status, { error: result.error });
  return new Response(Uint8Array.from(result.key), {
    headers: { ...NO_STORE, "Content-Type": "application/octet-stream" },
  });
}
