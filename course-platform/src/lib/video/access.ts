import { MAX_WATERMARK_ID } from "./derive.ts";
import { devOpen } from "./config.ts";

// Who is asking to watch, and may they? Used by POST /api/video/session.
//
// Today (Phase 1) there is no real sign-in, so the only way in is
// VIDEO_DEV_OPEN=1, which treats every visitor as a demo viewer. With it off,
// nobody gets a token (401).

export type Viewer = {
  userId: string;
  watermarkId: number; // 1–65535, hidden in the a/b pattern of every segment
  label: string; // shown in the visible moving watermark, e.g. "Jane · jane@x.com"
};

export type VideoRef = { course: string; code: string };

/** Optional demo identity the player sends while VIDEO_DEV_OPEN=1. */
export type DemoIdentity = { name?: unknown; email?: unknown };

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Stable watermark id for a demo email: 1–65535 from its SHA-256. */
export async function demoWatermarkId(email: string) {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(email.trim().toLowerCase())));
  return (((digest[0] << 8) | digest[1]) % MAX_WATERMARK_ID) + 1;
}

/** The signed-in viewer, or null (401). */
export async function getViewer(request: Request, video: VideoRef, demo?: DemoIdentity): Promise<Viewer | null> {
  // ---- Phase 2 hook: real sign-in ------------------------------------------
  // const supabase = createServerClient(...cookies from `request`...);
  // const { data: { user } } = await supabase.auth.getUser();
  // if (user) {
  //   const { data: profile } = await supabase.from("profiles")
  //     .select("full_name, email, watermark_id").eq("id", user.id).single();
  //   return { userId: user.id, watermarkId: profile.watermark_id,
  //            label: `${profile.full_name} · ${profile.email}` };
  // }
  // return null;
  // --------------------------------------------------------------------------
  void request;
  void video;

  if (!devOpen()) return null;
  const email = clean(demo?.email, 200).toLowerCase() || "demo@example.com";
  const name = clean(demo?.name, 100);
  return {
    userId: `demo:${email}`,
    watermarkId: await demoWatermarkId(email),
    label: name ? `${name} · ${email}` : email,
  };
}

/** May this viewer watch this video? false = 403 (not enrolled, or the day is
 *  still locked). */
export async function canWatch(viewer: Viewer, video: VideoRef): Promise<boolean> {
  // ---- Phase 2 hook: enrollment + day unlocked -----------------------------
  // With the service role (server only):
  // 1. enrollments: a row for (viewer.userId, course) with status 'active' and
  //    expires_at null or in the future. None -> return false.
  // 2. Find the lesson with code video.code (src/lib/catalog.ts getCourse +
  //    course.modules[].lessons[].code) and its module.
  // 3. Load the student's ProgressState from lesson_progress + quiz_attempts and
  //    return moduleUnlocked(state, course, module) from src/lib/progress.ts,
  //    the same rule the app uses to lock days.
  // --------------------------------------------------------------------------
  void video;
  return viewer.userId.startsWith("demo:") && devOpen();
}
