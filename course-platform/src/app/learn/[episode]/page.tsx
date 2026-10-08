import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { AppBar } from "@/components/learn/app-bar";
import { StudentGate } from "@/components/student-gate";
import { course, getEpisode } from "@/lib/catalog";
import { LessonView } from "./lesson-view";

export function generateStaticParams() {
  return course.modules.map((m) => ({ episode: m.slug }));
}

export async function generateMetadata(props: PageProps<"/learn/[episode]">): Promise<Metadata> {
  const ep = getEpisode((await props.params).episode);
  return { title: ep ? `${ep.label}: ${ep.title}` : "Lesson" };
}

export default async function EpisodePage(props: PageProps<"/learn/[episode]">) {
  const { episode } = await props.params;
  const ep = getEpisode(episode);
  if (!ep) notFound();
  return (
    <>
      <AppBar center={<span className="hidden sm:inline"><span className="text-white">{ep.label}</span> · {ep.title}</span>} />
      <ViewTransition enter="page-fade" exit="page-fade" default="none">
        <main className="min-h-dvh bg-black">
          <StudentGate courseId={course.id}>
            <LessonView key={ep.slug} slug={ep.slug} />
          </StudentGate>
        </main>
      </ViewTransition>
    </>
  );
}
