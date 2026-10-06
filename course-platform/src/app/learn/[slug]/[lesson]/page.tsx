import { notFound } from "next/navigation";
import { StudentGate } from "@/components/student-gate";
import { courses, findLesson, getCourse } from "@/lib/catalog";
import { LessonView } from "./lesson-view";

export function generateStaticParams() {
  return courses.flatMap((c) => c.modules.flatMap((m) => m.lessons.map((l) => ({ slug: c.slug, lesson: l.id }))));
}

export default async function LessonPage(props: PageProps<"/learn/[slug]/[lesson]">) {
  const { slug, lesson } = await props.params;
  const course = getCourse(slug);
  const found = course && findLesson(course, lesson);
  if (!course || !found) notFound();
  return (
    <div className="min-h-dvh bg-bg">
      <StudentGate courseId={course.id}>
        <LessonView key={lesson} course={course} lessonId={lesson} />
      </StudentGate>
    </div>
  );
}
