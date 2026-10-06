import type { Metadata } from "next";
import { ComingSoonCard, CourseCard } from "@/components/course-cards";
import { Footer, SiteNav } from "@/components/nav";
import { Reveal } from "@/components/reveal";
import { comingSoon, courses } from "@/lib/catalog";

export const metadata: Metadata = { title: "Courses" };

export default function CoursesPage() {
  return (
    <>
      <SiteNav />
      <main className="wrap pb-28 pt-16 sm:pt-24">
        <Reveal>
          <h1 className="display text-[clamp(40px,7vw,80px)]">Courses.</h1>
          <p className="mt-4 max-w-xl text-[19px] leading-relaxed text-muted">
            Carefully made, practical, and taught by people who do the work every day.
          </p>
        </Reveal>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <Reveal key={c.id}>
              <CourseCard course={c} />
            </Reveal>
          ))}
          {comingSoon.map((c, i) => (
            <Reveal key={c.id} delay={0.06 * (i + 1)}>
              <ComingSoonCard item={c} />
            </Reveal>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
