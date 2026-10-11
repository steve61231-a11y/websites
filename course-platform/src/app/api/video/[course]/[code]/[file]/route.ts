import { connection, type NextRequest } from "next/server";
import { masterPlaylist, mediaPlaylist } from "@/lib/video/hls";
import { json, playback, playlist, validRendition } from "../../../_shared";

// GET /api/video/<course>/<code>/master.m3u8?t=   master playlist
// GET /api/video/<course>/<code>/<rendition>.m3u8?t=   one student's media playlist

export async function GET(request: NextRequest, { params }: { params: Promise<{ course: string; code: string; file: string }> }) {
  await connection(); // per request, never prerendered or cached
  const { course, code, file } = await params;
  const p = await playback(request, request.nextUrl, course, code);
  if (p instanceof Response) return p;

  if (file === "master.m3u8") return playlist(masterPlaylist(p.stream, p.token));

  const rendition = file.endsWith(".m3u8") ? file.slice(0, -".m3u8".length) : "";
  if (!validRendition(rendition) || !p.stream.renditions.some((r) => r.id === rendition)) {
    return json(404, { error: "not found" });
  }
  return playlist(
    await mediaPlaylist({
      secret: p.config.secret,
      cdnUrl: p.config.cdnUrl,
      course,
      code,
      stream: p.stream,
      rendition,
      watermarkId: p.payload.w,
      token: p.token,
    }),
  );
}
