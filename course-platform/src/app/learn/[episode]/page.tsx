import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense, ViewTransition } from "react";
import { AppBar } from "@/components/learn/app-bar";
import { StudentGate } from "@/components/student-gate";
import { course, getEpisode } from "@/lib/catalog";
import { LessonView } from "./lesson-view";

type Params = PageProps<"/learn/[episode]">["params"];

export function generateStaticParams() {
  return course.modules.map((m) => ({ episode: m.slug }));
}

export async function generateMetadata(props: PageProps<"/learn/[episode]">): Promise<Metadata> {
  const ep = getEpisode((await props.params).episode);
  return { title: ep ? `${ep.label}: ${ep.title}` : "Lesson" };
}

// The page shell renders immediately; the parts that need the URL sit inside
// Suspense so client navigations stay instant.
export default function EpisodePage(props: PageProps<"/learn/[episode]">) {
  return (
    <>
      <Suspense fallback={<AppBar />}>
        <EpisodeBar params={props.params} />
      </Suspense>
      <ViewTransition enter="page-fade" exit="page-fade" default="none">
        <main className="min-h-dvh bg-black">
          <Suspense fallback={null}>
            <Episode params={props.params} />
          </Suspense>
        </main>
      </ViewTransition>
    </>
  );
}

async function EpisodeBar({ params }: { params: Params }) {
  const ep = getEpisode((await params).episode);
  return (
    <AppBar
      center={
        ep && (
          <span className="hidden sm:inline">
            <span className="text-white">{ep.label}</span> · {ep.title}
          </span>
        )
      }
    />
  );
}

async function Episode({ params }: { params: Params }) {
  const ep = getEpisode((await params).episode);
  if (!ep) notFound();
  return (
    <StudentGate courseId={course.id}>
      <LessonView key={ep.slug} slug={ep.slug} />
    </StudentGate>
  );
}
