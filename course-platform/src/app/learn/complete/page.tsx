import type { Metadata } from "next";
import { StudentGate } from "@/components/student-gate";
import { course } from "@/lib/catalog";
import { Completion } from "./completion";
import { PageTransition } from "@/components/motion/page";

export const metadata: Metadata = { title: "You did it" };

export default function CompletePage() {
  return (
    <PageTransition>
      <main className="min-h-dvh bg-black">
        <StudentGate courseId={course.id}>
          <Completion />
        </StudentGate>
      </main>
    </PageTransition>
  );
}
