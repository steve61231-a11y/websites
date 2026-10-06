import { notFound } from "next/navigation";
import { StudentGate } from "@/components/student-gate";
import { courses, getCourse } from "@/lib/catalog";
import { QuizView } from "./quiz-view";

export function generateStaticParams() {
  return courses.flatMap((c) => c.modules.filter((m) => m.quiz).map((m) => ({ slug: c.slug, module: m.id })));
}

export default async function QuizPage(props: PageProps<"/learn/[slug]/quiz/[module]">) {
  const { slug, module } = await props.params;
  const course = getCourse(slug);
  const mod = course?.modules.find((m) => m.id === module);
  if (!course || !mod?.quiz) notFound();
  return (
    <div className="min-h-dvh bg-bg">
      <StudentGate courseId={course.id}>
        <QuizView course={course} moduleId={mod.id} />
      </StudentGate>
    </div>
  );
}
