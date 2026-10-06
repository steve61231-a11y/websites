import { notFound } from "next/navigation";
import { CourseOverview } from "@/components/course-overview";
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
      <main className="pb-28 sm:pb-0">
        <StudentGate courseId={course.id}>
          <CourseOverview course={course} />
        </StudentGate>
      </main>
    </>
  );
}
