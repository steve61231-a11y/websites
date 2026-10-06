import { notFound } from "next/navigation";
import Link from "next/link";
import { CourseHome } from "@/components/course-home";
import { ChevronLeft } from "@/components/icons";
import { AppNav } from "@/components/nav";
import { StudentGate } from "@/components/student-gate";
import { courses, getCourse } from "@/lib/catalog";

export function generateStaticParams() {
  return courses.map((c) => ({ slug: c.slug }));
}

export default async function CourseHomePage(props: PageProps<"/learn/[slug]">) {
  const course = getCourse((await props.params).slug);
  if (!course) notFound();
  return (
    <>
      <AppNav />
      <main className="pb-28 sm:pb-16">
        <StudentGate courseId={course.id}>
          <div className="wrap pt-8 sm:pt-12">
            <Link href="/dashboard" className="inline-flex items-center gap-1 text-[14px] text-accent">
              <ChevronLeft size={16} /> All courses
            </Link>
            <h1 className="display mt-3 mb-8 text-[clamp(30px,4.5vw,44px)]">{course.title}</h1>
            <CourseHome course={course} />
          </div>
        </StudentGate>
      </main>
    </>
  );
}
