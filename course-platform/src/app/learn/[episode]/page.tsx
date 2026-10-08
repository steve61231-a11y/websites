import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AppBar } from "@/components/learn/app-bar";
import { StudentGate } from "@/components/student-gate";
import { course, getEpisode } from "@/lib/catalog";
import { ResumeDay } from "./resume-day";

type Params = PageProps<"/learn/[episode]">["params"];

export function generateStaticParams() {
  return course.modules.map((m) => ({ episode: m.slug }));
}

/** /learn/day-2 opens the first unfinished lesson of that day. */
export default function DayPage(props: PageProps<"/learn/[episode]">) {
  return (
    <>
      <AppBar />
      <main className="min-h-dvh bg-black">
        <Suspense fallback={null}>
          <Day params={props.params} />
        </Suspense>
      </main>
    </>
  );
}

async function Day({ params }: { params: Params }) {
  const ep = getEpisode((await params).episode);
  if (!ep) notFound();
  return (
    <StudentGate courseId={course.id}>
      <ResumeDay slug={ep.slug} />
    </StudentGate>
  );
}
