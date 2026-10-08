import type { Metadata } from "next";
import { AppBar } from "@/components/learn/app-bar";
import { StudentGate } from "@/components/student-gate";
import { Account } from "./account";

export const metadata: Metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <>
      <AppBar />
      <main className="min-h-dvh bg-black pb-24 pt-24">
        <StudentGate>
          <Account />
        </StudentGate>
      </main>
    </>
  );
}
