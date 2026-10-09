import type { Metadata } from "next";
import { AppBar } from "@/components/learn/app-bar";
import { StudentGate } from "@/components/student-gate";
import { Account } from "./account";
import { PageTransition } from "@/components/motion/page";

export const metadata: Metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <>
      <AppBar />
      <PageTransition>
        <main className="min-h-dvh bg-black pb-24 pt-24">
          <StudentGate>
            <Account />
          </StudentGate>
        </main>
      </PageTransition>
    </>
  );
}
