import type { Metadata } from "next";
import { ViewTransition } from "react";
import { AppBar } from "@/components/learn/app-bar";
import { StudentGate } from "@/components/student-gate";
import { course } from "@/lib/catalog";
import { CourseHome } from "./course-home";

export const metadata: Metadata = { title: "Learn" };

export default function LearnPage() {
  return (
    <>
      <AppBar />
      <ViewTransition enter="page-fade" exit="page-fade" default="none">
        <main className="min-h-dvh bg-black pb-24">
          <StudentGate courseId={course.id}>
            <CourseHome />
          </StudentGate>
        </main>
      </ViewTransition>
    </>
  );
}
