import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { StudentGate } from "@/components/student-gate";
import { course, getEpisode } from "@/lib/catalog";
import { QuizView } from "./quiz-view";

export function generateStaticParams() {
  return course.modules.filter((m) => m.quiz).map((m) => ({ episode: m.slug }));
}

export const metadata: Metadata = { title: "Quiz" };

export default async function QuizPage(props: PageProps<"/learn/[episode]/quiz">) {
  const ep = getEpisode((await props.params).episode);
  if (!ep?.quiz) notFound();
  return (
    <ViewTransition enter="page-fade" exit="page-fade" default="none">
      <main className="min-h-dvh bg-black">
        <StudentGate courseId={course.id}>
          <QuizView key={ep.slug} slug={ep.slug} />
        </StudentGate>
      </main>
    </ViewTransition>
  );
}
