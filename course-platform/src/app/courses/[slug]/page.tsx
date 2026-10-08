import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense, ViewTransition } from "react";
import { CourseHero } from "@/components/course/hero";
import { Curriculum } from "@/components/course/curriculum";
import { Faq, Instructor, Outcomes, Pricing } from "@/components/course/sections";
import { SiteFooter } from "@/components/site/footer";
import { SiteNav } from "@/components/site/nav";
import { courses, getCourse } from "@/lib/catalog";

type Params = PageProps<"/courses/[slug]">["params"];

export function generateStaticParams() {
  return courses.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata(props: PageProps<"/courses/[slug]">): Promise<Metadata> {
  const c = getCourse((await props.params).slug);
  return c ? { title: c.title, description: c.tagline } : { title: "Course" };
}

export default function CoursePage(props: PageProps<"/courses/[slug]">) {
  return (
    <>
      <SiteNav overDark />
      <ViewTransition enter="page-fade" exit="page-fade" default="none">
        <main className="bg-black">
          <Suspense fallback={<div className="min-h-[100svh] bg-black" />}>
            <CourseBody params={props.params} />
          </Suspense>
        </main>
      </ViewTransition>
      <SiteFooter />
    </>
  );
}

async function CourseBody({ params }: { params: Params }) {
  const course = getCourse((await params).slug);
  if (!course) notFound();
  return (
    <>
      <CourseHero course={course} />
      <Curriculum course={course} />
      <Outcomes course={course} />
      <Instructor course={course} />
      <Pricing course={course} />
      <Faq course={course} />
    </>
  );
}
