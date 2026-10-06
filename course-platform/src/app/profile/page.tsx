import type { Metadata } from "next";
import { AppNav } from "@/components/nav";
import { StudentGate } from "@/components/student-gate";
import { Profile } from "./profile";

export const metadata: Metadata = { title: "Profile" };

export default function ProfilePage() {
  return (
    <>
      <AppNav />
      <main className="pb-28 sm:pb-16">
        <StudentGate>
          <Profile />
        </StudentGate>
      </main>
    </>
  );
}
