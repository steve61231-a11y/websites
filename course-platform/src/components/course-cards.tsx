import Link from "next/link";
import { courseStats, formatPrice } from "@/lib/catalog";
import type { ComingSoon, Course } from "@/lib/types";
import { LensArt } from "./lens-art";
import { Lock } from "./icons";

export function CourseCard({ course }: { course: Course }) {
  const stats = courseStats(course);
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group card flex h-full flex-col overflow-hidden transition-transform duration-500 ease-(--ease-apple) hover:-translate-y-1"
    >
      <div className="relative grid aspect-[4/3] place-items-center overflow-hidden bg-night">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,#1f3a66_0%,transparent_60%)] opacity-70" />
        <LensArt className="relative w-[62%] transition-transform duration-700 ease-(--ease-apple) group-hover:scale-[1.04]" animate={false} />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="eyebrow">{course.level}</p>
        <h3 className="mt-1.5 text-[21px] font-semibold leading-tight tracking-[-0.02em]">{course.title}</h3>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">{course.tagline}</p>
        <div className="mt-6 flex items-center justify-between border-t border-line pt-4 text-[13px]">
          <span className="text-muted">
            {stats.modules} modules · {course.instructor.name}
          </span>
          <span className="font-semibold">{formatPrice(course.price, course.currency)}</span>
        </div>
      </div>
    </Link>
  );
}

export function ComingSoonCard({ item, compact = false }: { item: ComingSoon; compact?: boolean }) {
  return (
    <div className="card relative flex h-full flex-col overflow-hidden" aria-label="Course coming soon">
      <div className={`relative overflow-hidden ${compact ? "aspect-square sm:aspect-[4/3]" : "aspect-[4/3]"}`}>
        <div
          className="absolute -inset-10 blur-2xl"
          style={{
            background: `radial-gradient(circle at 30% 30%, hsl(${item.hue} 80% 70%), transparent 55%),
              radial-gradient(circle at 75% 65%, hsl(${item.hue + 40} 70% 60%), transparent 50%),
              hsl(${item.hue} 30% 92%)`,
          }}
        />
        <div className="absolute inset-0 grid place-items-center">
          <div className="grid size-12 place-items-center rounded-full bg-white/60 text-ink-2 backdrop-blur-md">
            <Lock size={20} />
          </div>
        </div>
      </div>
      <div className={`flex flex-1 flex-col ${compact ? "p-3 sm:p-6" : "p-6"}`}>
        <p className="eyebrow">{item.hint}</p>
        <h3 className={`mt-1.5 font-semibold tracking-[-0.02em] text-ink-2 ${compact ? "hidden text-[21px] sm:block" : "text-[21px]"}`}>Coming soon</h3>
        <div className={`mt-3 space-y-2 ${compact ? "hidden sm:block" : ""}`} aria-hidden>
          <div className="h-2.5 w-4/5 rounded-full bg-fill" />
          <div className="h-2.5 w-3/5 rounded-full bg-fill" />
        </div>
      </div>
    </div>
  );
}
