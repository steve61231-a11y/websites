import type { Metadata } from "next";
import { AppBar } from "@/components/learn/app-bar";
import { StudentGate } from "@/components/student-gate";
import { course } from "@/lib/catalog";
import { CourseHome } from "./course-home";
import { PageTransition } from "@/components/motion/page";

export const metadata: Metadata = { title: "Learn" };

export default function LearnPage() {
  return (
    <>
      <AppBar />
      <PageTransition>
        <main className="min-h-dvh bg-black pb-24">
          <StudentGate courseId={course.id}>
            <CourseHome />
          </StudentGate>
        </main>
      </PageTransition>
    </>
  );
}
