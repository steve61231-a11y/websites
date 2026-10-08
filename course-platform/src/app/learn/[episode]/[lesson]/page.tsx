import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense, ViewTransition } from "react";
import { AppBar } from "@/components/learn/app-bar";
import { StudentGate } from "@/components/student-gate";
import { course, getLesson } from "@/lib/catalog";
import { LessonView } from "./lesson-view";

type Params = PageProps<"/learn/[episode]/[lesson]">["params"];

export function generateStaticParams() {
  return course.modules.flatMap((m) => m.lessons.map((l) => ({ episode: m.slug, lesson: l.slug })));
}

export async function generateMetadata(props: PageProps<"/learn/[episode]/[lesson]">): Promise<Metadata> {
  const { episode, lesson } = await props.params;
  const found = getLesson(episode, lesson);
  return { title: found ? `${found.lesson.code} ${found.lesson.title}` : "Lesson" };
}

// The shell renders immediately; the parts that need the URL sit inside
// Suspense so client navigations stay instant.
export default function LessonPage(props: PageProps<"/learn/[episode]/[lesson]">) {
  return (
    <>
      <Suspense fallback={<AppBar />}>
        <Bar params={props.params} />
      </Suspense>
      <ViewTransition enter="page-fade" exit="page-fade" default="none">
        <main className="min-h-dvh bg-black">
          <Suspense fallback={null}>
            <Lesson params={props.params} />
          </Suspense>
        </main>
      </ViewTransition>
    </>
  );
}

async function Bar({ params }: { params: Params }) {
  const { episode, lesson } = await params;
  const found = getLesson(episode, lesson);
  return (
    <AppBar
      center={
        found && (
          <span className="hidden sm:inline">
            <span className="text-white">{found.ep.label}</span> · {found.lesson.title}
          </span>
        )
      }
    />
  );
}

async function Lesson({ params }: { params: Params }) {
  const { episode, lesson } = await params;
  const found = getLesson(episode, lesson);
  if (!found) notFound();
  return (
    <StudentGate courseId={course.id}>
      <LessonView key={found.lesson.id} episodeSlug={found.ep.slug} lessonSlug={found.lesson.slug} />
    </StudentGate>
  );
}
