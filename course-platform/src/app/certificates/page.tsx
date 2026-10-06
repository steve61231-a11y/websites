import type { Metadata } from "next";
import { AppNav } from "@/components/nav";
import { StudentGate } from "@/components/student-gate";
import { CertificateList } from "./certificate-list";

export const metadata: Metadata = { title: "Certificates" };

export default function CertificatesPage() {
  return (
    <>
      <AppNav />
      <main className="pb-28 sm:pb-16">
        <StudentGate>
          <CertificateList />
        </StudentGate>
      </main>
    </>
  );
}
