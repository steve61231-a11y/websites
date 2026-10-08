import { theProd } from "./content/the-prod";
import type { Brand, Course } from "./types";

// The school's catalogue. Each course lives in src/lib/content/<course>/; add
// it to `courses` below to list it. In Phase 2 this comes from Supabase
// (courses → modules → lessons, quizzes → questions).

export const brand: Brand = {
  name: "THE PROD",
  subtitle: "E-commerce Product Photography with AI",
  organisation: "Product Photography Kenya",
  email: "hello@productphotography.co.ke",
  whatsapp: "+254 724 714 388", // to confirm: the summary lists "254 (724) 714,388 319"
  website: "https://www.productphotography.co.ke",
  bookingUrl: "#book", // calendar link to come
};

/** The course the learning app shows. Learning routes are single-course for now. */
export const course: Course = theProd;

export const courses: Course[] = [theProd];

export function getCourse(slug: string): Course | undefined {
  return courses.find((c) => c.slug === slug);
}

export function getCourseById(id: string): Course | undefined {
  return courses.find((c) => c.id === id);
}

export function getEpisode(slug: string) {
  return course.modules.find((m) => m.slug === slug);
}

export function findLesson(c: Course, lessonId: string) {
  for (const mod of c.modules) {
    const index = mod.lessons.findIndex((l) => l.id === lessonId);
    if (index !== -1) return { module: mod, lesson: mod.lessons[index], index };
  }
  return undefined;
}

export function courseStats(c: Course) {
  const lessons = c.modules.flatMap((m) => m.lessons);
  const seconds = lessons.reduce((sum, l) => sum + l.durationSec, 0);
  const quizzes = c.modules.filter((m) => m.quiz).length;
  return { modules: c.modules.length, lessons: lessons.length, seconds, quizzes, days: c.modules.filter((m) => m.kind === "day").length };
}

export function formatPrice(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString("en-US")}`;
}

export function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

export function formatClock(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function getLesson(episodeSlug: string, lessonSlug: string) {
  const ep = getEpisode(episodeSlug);
  const lesson = ep?.lessons.find((l) => l.slug === lessonSlug);
  return ep && lesson ? { ep, lesson } : undefined;
}

/** "2.3" for days, the title alone for the introduction and conclusion. */
export function lessonLabel(code: string, kind: "welcome" | "day" | "wrap") {
  return kind === "wrap" ? "Conclusion" : code;
}
