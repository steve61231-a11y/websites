import { notFound } from "next/navigation";
import { StudentGate } from "@/components/student-gate";
import { courses, getCourse } from "@/lib/catalog";
import { Completion } from "./completion";

export function generateStaticParams() {
  return courses.map((c) => ({ slug: c.slug }));
}

export default async function CompletePage(props: PageProps<"/learn/[slug]/complete">) {
  const course = getCourse((await props.params).slug);
  if (!course) notFound();
  return (
    <div className="min-h-dvh bg-night text-night-ink">
      <StudentGate courseId={course.id}>
        <Completion course={course} />
      </StudentGate>
    </div>
  );
}
