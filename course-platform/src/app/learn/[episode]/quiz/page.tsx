import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StudentGate } from "@/components/student-gate";
import { course, getEpisode } from "@/lib/catalog";
import { QuizView } from "./quiz-view";
import { PageTransition } from "@/components/motion/page";

type Params = PageProps<"/learn/[episode]/quiz">["params"];

export function generateStaticParams() {
  return course.modules.filter((m) => m.quiz).map((m) => ({ episode: m.slug }));
}

export const metadata: Metadata = { title: "Quiz" };

export default function QuizPage(props: PageProps<"/learn/[episode]/quiz">) {
  return (
    <PageTransition>
      <main className="min-h-dvh bg-black">
        <Suspense fallback={null}>
          <Quiz params={props.params} />
        </Suspense>
      </main>
    </PageTransition>
  );
}

async function Quiz({ params }: { params: Params }) {
  const ep = getEpisode((await params).episode);
  if (!ep?.quiz) notFound();
  return (
    <StudentGate courseId={course.id}>
      <QuizView key={ep.slug} slug={ep.slug} />
    </StudentGate>
  );
}
