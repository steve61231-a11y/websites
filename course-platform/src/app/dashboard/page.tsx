import type { Metadata } from "next";
import { AppNav } from "@/components/nav";
import { StudentGate } from "@/components/student-gate";
import { Dashboard } from "./dashboard";

export const metadata: Metadata = { title: "Learn" };

export default function DashboardPage() {
  return (
    <>
      <AppNav />
      <main className="pb-28 sm:pb-16">
        <StudentGate>
          <Dashboard />
        </StudentGate>
      </main>
    </>
  );
}
