import { MAX_WATERMARK_ID } from "./derive.ts";
import { devOpen } from "./config.ts";

// Who is asking to watch, and may they? Used by POST /api/video/session.
//
// With the Supabase backend configured, only signed-in, enrolled students get
// in. Without it, the only way in is VIDEO_DEV_OPEN=1, which treats every
// visitor as a demo viewer. With that off too, nobody gets a token (401).

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

// ---- Real students (when the Supabase backend is configured) ---------------
// The browser sends its sign-in token as "Authorization: Bearer ...". The
// server checks it with Supabase, then takes the student's hidden watermark
// id from their profile. Imported lazily so the video tools and tests that
// run without a database never load Supabase.

/** undefined = backend not configured (fall back to the demo rules). */
async function realViewer(request: Request): Promise<Viewer | null | undefined> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) return undefined;
  const { supabaseStore, userFromRequest } = await import("@/lib/server/store");
  const user = await userFromRequest(request);
  if (!user) return null;
  const profile = await supabaseStore().profile(user.id);
  if (!profile?.watermark_id) return null;
  return { userId: user.id, watermarkId: profile.watermark_id, label: `${profile.full_name || user.email} · ${user.email}` };
}

/** Enrolled in this course, and the day this video belongs to is unlocked. */
async function realCanWatch(userId: string, video: VideoRef): Promise<boolean> {
  const { getCourse } = await import("@/lib/catalog");
  const { snapshot, canWatch: unlocked } = await import("@/lib/server/learn");
  const { supabaseStore } = await import("@/lib/server/store");
  const course = getCourse(video.course);
  if (!course) return false;
  const mod = course.modules.find((m) => m.lessons.some((l) => l.code === video.code));
  if (!mod) return false;
  const store = supabaseStore();
  if (!(await store.enrolledCourses(userId)).includes(course.slug)) return false;
  const state = snapshot(course, await store.lessonRows(userId, course.slug), await store.attemptRows(userId, course.slug), []);
  return unlocked(state, course, mod);
}

/** The signed-in viewer, or null (401). */
export async function getViewer(request: Request, video: VideoRef, demo?: DemoIdentity): Promise<Viewer | null> {
  const real = await realViewer(request);
  if (real !== undefined) return real; // backend on: only real, signed-in students

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
  if (!viewer.userId.startsWith("demo:")) return realCanWatch(viewer.userId, video);
  return viewer.userId.startsWith("demo:") && devOpen();
}
